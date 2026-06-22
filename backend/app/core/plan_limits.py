"""
Plan enforcement dependency.

Usage in route:
    from app.core.plan_limits import enforce_plan_limit

    @router.post("/analyze")
    async def analyze(
        ...,
        _: None = Depends(enforce_plan_limit("detections_per_month")),
    ):
"""
from __future__ import annotations

from functools import lru_cache
from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.org_middleware import get_current_org
from app.models import User, Subscription, Plan, UsageMetric

# ── Plan limit definitions ────────────────────────────────────────────────────
# None means unlimited.

PLAN_LIMITS: dict[str, dict[str, Optional[int]]] = {
    "free": {
        "detections_per_month": 1_000,
        "applications": 2,
        "api_keys": 3,
        "team_members": 1,
        "webhooks": 0,
        "ip_allowlist": 0,
    },
    "starter": {
        "detections_per_month": 25_000,
        "applications": 10,
        "api_keys": 10,
        "team_members": 5,
        "webhooks": 3,
        "ip_allowlist": 5,
    },
    "professional": {
        "detections_per_month": 250_000,
        "applications": 50,
        "api_keys": 50,
        "team_members": 25,
        "webhooks": 10,
        "ip_allowlist": 20,
    },
    "business": {
        "detections_per_month": 1_000_000,
        "applications": 200,
        "api_keys": 200,
        "team_members": 100,
        "webhooks": 25,
        "ip_allowlist": None,
    },
    "enterprise": {
        "detections_per_month": None,
        "applications": None,
        "api_keys": None,
        "team_members": None,
        "webhooks": None,
        "ip_allowlist": None,
    },
}

DEFAULT_PLAN = "free"


def get_org_plan(org_id: str, db: Session) -> str:
    """Return the active plan name for an organization."""
    sub = (
        db.query(Subscription)
        .filter(
            Subscription.organization_id == org_id,
            Subscription.status == "active",
        )
        .first()
    )
    if not sub:
        return DEFAULT_PLAN

    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    if not plan:
        return DEFAULT_PLAN

    return plan.name.lower()


def get_plan_limit(plan_name: str, resource: str) -> Optional[int]:
    limits = PLAN_LIMITS.get(plan_name, PLAN_LIMITS[DEFAULT_PLAN])
    return limits.get(resource)


def enforce_plan_limit(resource: str):
    """
    FastAPI dependency factory. Raises 402 if the org has exceeded its limit
    for *resource* on the current plan.

    Call counts are checked against the UsageMetric table (detections) or
    simple row counts for other resources.
    """

    async def _check(
        org_id: str = Depends(get_current_org),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> None:
        plan_name = get_org_plan(org_id, db)
        limit = get_plan_limit(plan_name, resource)

        if limit is None:
            return  # unlimited

        current_usage = _get_current_usage(resource, org_id, db)

        if current_usage >= limit:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=(
                    f"Plan limit reached for '{resource}' "
                    f"({current_usage}/{limit} on '{plan_name}' plan). "
                    "Please upgrade your plan."
                ),
            )

    return _check


def _get_current_usage(resource: str, org_id: str, db: Session) -> int:
    from app.models import Application, ApiKey, Webhook, IpAllowlist
    from sqlalchemy import func
    from datetime import datetime
    from calendar import monthrange

    if resource == "detections_per_month":
        now = datetime.utcnow()
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        from app.models import Detection
        count = (
            db.query(func.sum(UsageMetric.total_requests))
            .filter(
                UsageMetric.organization_id == org_id,
                UsageMetric.created_at >= first_day,
            )
            .scalar()
        )
        return count or 0

    elif resource == "applications":
        return db.query(Application).filter(Application.organization_id == org_id).count()

    elif resource == "api_keys":
        return db.query(ApiKey).filter(ApiKey.organization_id == org_id, ApiKey.is_active == True).count()

    elif resource == "team_members":
        from app.models import organization_users
        rows = db.execute(
            organization_users.select().where(
                organization_users.c.organization_id == org_id
            )
        ).fetchall()
        return len(rows)

    elif resource == "webhooks":
        return db.query(Webhook).filter(Webhook.organization_id == org_id, Webhook.is_active == True).count()

    elif resource == "ip_allowlist":
        return db.query(IpAllowlist).filter(IpAllowlist.organization_id == org_id, IpAllowlist.is_active == True).count()

    return 0
