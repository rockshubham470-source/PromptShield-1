from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models import Detection

router = APIRouter(
    prefix="/application-stats",
    tags=["Application Stats"]
)

@router.get("/{application_id}")
def stats(
    application_id: str,
    db: Session = Depends(get_db)
):
    total = db.query(
        func.count(Detection.id)
    ).filter(
        Detection.application_id
        == application_id
    ).scalar()

    critical = db.query(
        func.count(Detection.id)
    ).filter(
        Detection.application_id
        == application_id,
        Detection.risk_level=="critical"
    ).scalar()

    return {
        "total_requests": total,
        "critical_alerts": critical
    }