from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import AuditLog, User
from app.schemas import TelemetryCreate
from app.api.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/v1/telemetry", tags=["telemetry"])

@router.post("")
async def receive_telemetry(
    request: Request,
    payload: TelemetryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Receive telemetry data from SDK and store an audit log.
    Does not store raw prompt, only metadata.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    import json
    details_dict = {
        "hash": payload.hash,
        "score": payload.score,
        "timestamp": payload.timestamp,
        "tenantId": payload.tenantId,
        "categories": payload.categories,
        "riskLevel": payload.riskLevel,
    }
    details_json = json.dumps(details_dict)

    audit_log = AuditLog(
        user_id=current_user.id,
        application_id=None,
        action="prompt_analysis",
        resource=payload.hash,
        details=details_json,
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=datetime.utcnow(),
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return {"status": "logged", "id": audit_log.id}