from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from app.core.database import get_db
from app.core.org_middleware import get_current_org
from app.models import UsageMetric

router = APIRouter(prefix="/usage", tags=["usage"])

@router.get("/daily")
async def get_daily_usage(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org)
):
    """
    Return today's request and blocked request totals for the organization.
    In a production environment, this would be a pre‑computed rollup table
    updated nightly by a background job.
    """
    today = cast(func.now(), Date)
    result = db.query(
        func.coalesce(func.sum(UsageMetric.total_requests), 0).label("requests"),
        func.coalesce(func.sum(UsageMetric.blocked_requests), 0).label("blocked")
    ).filter(
        UsageMetric.organization_id == org_id,
        func.date(UsageMetric.created_at) == today
    ).one()

    return {
        "date": today.isoformat() if hasattr(today, "isoformat") else str(today),
        "total_requests": result.requests,
        "blocked_requests": result.blocked
    }