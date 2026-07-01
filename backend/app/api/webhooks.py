"""
Webhook management API.

Organizations can register HTTPS endpoints to receive real-time event
notifications. Each delivery is HMAC-SHA256 signed using the webhook's secret.

Supported events:
  detection.created   — every analyzed prompt
  detection.critical  — only risk_level == "critical"
  detection.risky     — risk_level in {risky, critical}
  rule.created
  rule.updated
  api_key.created
  api_key.revoked
"""
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, HttpUrl, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.org_middleware import get_current_org
from app.models import User, Webhook

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

SUPPORTED_EVENTS = {
    "detection.created",
    "detection.critical",
    "detection.risky",
    "rule.created",
    "rule.updated",
    "api_key.created",
    "api_key.revoked",
}

# ── schemas ──────────────────────────────────────────────────────────────────

class WebhookCreate(BaseModel):
    name: str
    url: str
    events: list[str]

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: list[str]) -> list[str]:
        unknown = set(v) - SUPPORTED_EVENTS
        if unknown:
            raise ValueError(f"Unknown events: {unknown}. Supported: {SUPPORTED_EVENTS}")
        return v

    @field_validator("url")
    @classmethod
    def validate_https(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("Webhook URL must use HTTPS.")
        return v


class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    events: Optional[list[str]] = None
    is_active: Optional[bool] = None

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is not None:
            unknown = set(v) - SUPPORTED_EVENTS
            if unknown:
                raise ValueError(f"Unknown events: {unknown}")
        return v


class WebhookResponse(BaseModel):
    id: str
    name: str
    url: str
    events: list[str]
    is_active: bool
    created_at: datetime
    last_triggered_at: Optional[datetime]
    last_status_code: Optional[int]
    failure_count: int

    class Config:
        from_attributes = True


# ── signing helper ────────────────────────────────────────────────────────────

def compute_signature(secret: str, payload: bytes) -> str:
    """Return HMAC-SHA256 hex signature for a webhook payload."""
    mac = hmac.new(secret.encode(), payload, hashlib.sha256)
    return "sha256=" + mac.hexdigest()


# ── background delivery ───────────────────────────────────────────────────────

async def _deliver(webhook_id: str, event: str, payload: dict, db: Session) -> None:
    wh = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    if not wh or not wh.is_active:
        return

    body = json.dumps({"event": event, "timestamp": int(time.time()), "data": payload}).encode()
    sig = compute_signature(wh.secret, body)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                wh.url,
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "X-PromptShield-Signature": sig,
                    "X-PromptShield-Event": event,
                },
            )
        wh.last_status_code = resp.status_code
        wh.failure_count = 0 if resp.status_code < 400 else wh.failure_count + 1
    except Exception:
        wh.last_status_code = None
        wh.failure_count = (wh.failure_count or 0) + 1

    wh.last_triggered_at = datetime.utcnow()
    db.commit()


async def fire_event(event: str, payload: dict, org_id: str, db: Session) -> None:
    """Deliver *event* to all active webhooks subscribed to it for *org_id*."""
    hooks = db.query(Webhook).filter(
        Webhook.organization_id == org_id,
        Webhook.is_active == True,
    ).all()
    for wh in hooks:
        subscribed: list[str] = json.loads(wh.events)
        if event in subscribed:
            await _deliver(wh.id, event, payload, db)


# ── CRUD endpoints ────────────────────────────────────────────────────────────

@router.get("/", response_model=list[WebhookResponse])
def list_webhooks(
    org_id: str = Depends(get_current_org),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    hooks = db.query(Webhook).filter(Webhook.organization_id == org_id).all()
    result = []
    for wh in hooks:
        result.append({
            **wh.__dict__,
            "events": json.loads(wh.events),
        })
    return result


@router.post("/", response_model=dict, status_code=201)
def create_webhook(
    body: WebhookCreate,
    org_id: str = Depends(get_current_org),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    wh = Webhook(
        organization_id=org_id,
        name=body.name,
        url=body.url,
        secret=secrets.token_hex(32),
        events=json.dumps(body.events),
        is_active=True,
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return {
        "id": wh.id,
        "name": wh.name,
        "url": wh.url,
        "secret": wh.secret,  
        "events": json.loads(wh.events),
        "is_active": wh.is_active,
        "created_at": wh.created_at,
    }


@router.patch("/{webhook_id}", response_model=WebhookResponse)
def update_webhook(
    webhook_id: str,
    body: WebhookUpdate,
    org_id: str = Depends(get_current_org),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    wh = db.query(Webhook).filter(
        Webhook.id == webhook_id,
        Webhook.organization_id == org_id,
    ).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found.")

    if body.name is not None:
        wh.name = body.name
    if body.events is not None:
        wh.events = json.dumps(body.events)
    if body.is_active is not None:
        wh.is_active = body.is_active

    db.commit()
    db.refresh(wh)
    return {**wh.__dict__, "events": json.loads(wh.events)}


@router.delete("/{webhook_id}", status_code=204)
def delete_webhook(
    webhook_id: str,
    org_id: str = Depends(get_current_org),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    wh = db.query(Webhook).filter(
        Webhook.id == webhook_id,
        Webhook.organization_id == org_id,
    ).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found.")
    db.delete(wh)
    db.commit()


@router.post("/{webhook_id}/test", status_code=200)
async def test_webhook(
    webhook_id: str,
    background_tasks: BackgroundTasks,
    org_id: str = Depends(get_current_org),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Send a test ping to the webhook URL."""
    wh = db.query(Webhook).filter(
        Webhook.id == webhook_id,
        Webhook.organization_id == org_id,
    ).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found.")

    background_tasks.add_task(
        _deliver, wh.id, "ping", {"message": "PromptShield webhook test"}, db
    )
    return {"message": "Test delivery queued."}


@router.get("/supported-events", status_code=200)
def get_supported_events():
    return {"events": sorted(SUPPORTED_EVENTS)}
