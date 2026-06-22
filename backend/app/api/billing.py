from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.org_middleware import get_current_org
from app.models import Plan, Subscription

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans")
def list_plans(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org)
):
    plans = db.query(Plan).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "price_monthly": p.price_monthly,
            "features": p.features_json
        }
        for p in plans
    ]


@router.post("/subscribe/{plan_id}")
def subscribe(
    plan_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org)
):
    plan = (
        db.query(Plan)
        .filter(Plan.id == plan_id)
        .first()
    )

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    sub = (
        db.query(Subscription)
        .filter(Subscription.organization_id == org_id)
        .first()
    )

    if sub:
        sub.plan_id = plan_id
        sub.status = "active"
        sub.ends_at = None
    else:
        sub = Subscription(
            organization_id=org_id,
            plan_id=plan_id,
            status="active"
        )
        db.add(sub)

    db.commit()
    db.refresh(sub)

    return {
        "message": f"Subscribed to {plan.name}",
        "plan": plan.name,
        "price_monthly": plan.price_monthly
    }


@router.get("/current")
def get_current_subscription(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org)
):
    sub = (
        db.query(Subscription, Plan)
        .join(
            Plan,
            Subscription.plan_id == Plan.id
        )
        .filter(
            Subscription.organization_id == org_id
        )
        .order_by(
            Subscription.starts_at.desc()
        )
        .first()
    )

    if not sub:
        return {
            "id": None,
            "plan_id": None,
            "plan_name": "Free",
            "price_monthly": 0,
            "status": "active",
            "starts_at": None,
            "ends_at": None
        }

    subscription, plan = sub

    return {
        "id": subscription.id,
        "plan_id": subscription.plan_id,
        "plan_name": plan.name,
        "price_monthly": plan.price_monthly,
        "status": subscription.status,
        "starts_at": (
            subscription.starts_at.isoformat()
            if subscription.starts_at
            else None
        ),
        "ends_at": (
            subscription.ends_at.isoformat()
            if subscription.ends_at
            else None
        )
    }