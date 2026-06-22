"""
IP Allowlist API — per-organization CIDR-based access control.

When an organization has any active allowlist entries, only requests
originating from those CIDR ranges are permitted to use the Detection API.
Dashboard access is never blocked — only API calls via API key.
"""
import ipaddress
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.org_middleware import get_current_org
from app.models import User, IpAllowlist

router = APIRouter(prefix="/ip-allowlist", tags=["ip-allowlist"])

# ── schemas ──────────────────────────────────────────────────────────────────

class IpAllowlistCreate(BaseModel):
    cidr: str
    label: Optional[str] = None

    @field_validator("cidr")
    @classmethod
    def validate_cidr(cls, v: str) -> str:
        try:
            ipaddress.ip_network(v, strict=False)
        except ValueError:
            raise ValueError(f"'{v}' is not a valid CIDR block.")
        return v


class IpAllowlistResponse(BaseModel):
    id: str
    cidr: str
    label: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── helpers ───────────────────────────────────────────────────────────────────

def is_ip_allowed(client_ip: str, org_id: str, db: Session) -> bool:
    """
    Returns True if *client_ip* is covered by any active allowlist entry
    for the organization, OR if no allowlist entries exist (open by default).
    """
    entries = db.query(IpAllowlist).filter(
        IpAllowlist.organization_id == org_id,
        IpAllowlist.is_active == True,
    ).all()

    if not entries:
        return True   # no restrictions configured → allow all

    try:
        ip = ipaddress.ip_address(client_ip)
    except ValueError:
        return False

    for entry in entries:
        try:
            network = ipaddress.ip_network(entry.cidr, strict=False)
            if ip in network:
                return True
        except ValueError:
            continue

    return False


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[IpAllowlistResponse])
def list_entries(
    org_id: str = Depends(get_current_org),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(IpAllowlist).filter(IpAllowlist.organization_id == org_id).all()


@router.post("/", response_model=IpAllowlistResponse, status_code=201)
def add_entry(
    body: IpAllowlistCreate,
    org_id: str = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Prevent duplicates
    existing = db.query(IpAllowlist).filter(
        IpAllowlist.organization_id == org_id,
        IpAllowlist.cidr == body.cidr,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="CIDR already in allowlist.")

    entry = IpAllowlist(
        organization_id=org_id,
        cidr=body.cidr,
        label=body.label,
        created_by=current_user.id,
        is_active=True,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def remove_entry(
    entry_id: str,
    org_id: str = Depends(get_current_org),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    entry = db.query(IpAllowlist).filter(
        IpAllowlist.id == entry_id,
        IpAllowlist.organization_id == org_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found.")
    db.delete(entry)
    db.commit()


@router.patch("/{entry_id}/toggle", response_model=IpAllowlistResponse)
def toggle_entry(
    entry_id: str,
    org_id: str = Depends(get_current_org),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    entry = db.query(IpAllowlist).filter(
        IpAllowlist.id == entry_id,
        IpAllowlist.organization_id == org_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found.")
    entry.is_active = not entry.is_active
    db.commit()
    db.refresh(entry)
    return entry
