import uuid
import secrets
import hashlib
from typing import Any
from app.utils.audit_log import create_audit_log
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.core.org_middleware import get_current_org

from app.models import (
    User,
    Application,
    ApiKey,
    Detection,
    AuditLog,
    UsageMetric
)

from app.schemas import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApiKeyResponse,
    DetectionEventResponse
)
router = APIRouter(
    prefix="/applications",
    tags=["applications"],
    redirect_slashes=False
)


@router.post("")
async def create_application(
    application: ApplicationCreate,
    create_api_key: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
) -> dict[str, Any]:
    app_obj = Application(
        user_id=current_user.id,
        organization_id=org_id,
        name=application.name,
        description=application.description,
        environment=application.environment,
        provider=application.provider
    )

    db.add(app_obj)
    db.flush()

    metric = UsageMetric(
        id=str(uuid.uuid4()),
        application_id=app_obj.id,
        organization_id=org_id,
        total_requests=0,
        blocked_requests=0
    )
    db.add(metric)

    api_key_response = None
    raw_key = None
    if create_api_key:
        raw_key = f"ps_{secrets.token_urlsafe(32)}"
        hashed = hashlib.sha256(raw_key.encode()).hexdigest()

        api_key = ApiKey(
            application_id=app_obj.id,
            user_id=current_user.id,
            organization_id=org_id,
            name=f"Default Key for {app_obj.name}",
            key_hash=hashed,
            prefix=raw_key[:8] + "..." if len(raw_key) > 8 else raw_key
        )

        db.add(api_key)

    db.commit()

    db.refresh(app_obj)
    create_audit_log(
        db=db,
        user_id=current_user.id,
        application_id=app_obj.id,
        organization_id=org_id,
        action="Application Created",
        resource=app_obj.name,
        details=f"Created application {app_obj.name}"
    )
    if create_api_key:
        db.refresh(api_key)

    if create_api_key:
        from app.schemas import ApiKeyResponse
        api_key_response = ApiKeyResponse(
            id=api_key.id,
            name=api_key.name,
            prefix=api_key.prefix,
            created_at=api_key.created_at,
            last_used_at=api_key.last_used_at,
            is_active=api_key.is_active
        )

    response_data = {
        "id": app_obj.id,
        "user_id": app_obj.user_id,
        "name": app_obj.name,
        "description": app_obj.description,
        "environment": app_obj.environment,
        "provider": app_obj.provider,
        "is_active": app_obj.is_active,
        "created_at": app_obj.created_at
    }

    if api_key_response:
        response_data["api_key"] = {
            "api_key": raw_key,
            "api_key_info": api_key_response
        }

    return response_data
@router.get("", response_model=list[ApplicationResponse])
async def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
) -> list[ApplicationResponse]:

    return (
        db.query(Application)
        .filter(
            Application.user_id == current_user.id,
            Application.organization_id == org_id
        )
        .all()
    )


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse
)
async def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):

    app_obj = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
            Application.organization_id == org_id
        )
        .first()
    )

    if not app_obj:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return app_obj


@router.put(
    "/{application_id}",
    response_model=ApplicationResponse
)
async def update_application(
    application_id: str,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):

    app_obj = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
            Application.organization_id == org_id
        )
        .first()
    )

    if not app_obj:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    for key, value in payload.dict(
        exclude_unset=True
    ).items():
        setattr(app_obj, key, value)

    db.commit()
    db.refresh(app_obj)

    return app_obj


@router.delete("/{application_id}")
async def delete_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):

    app_obj = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
            Application.organization_id == org_id
        )
        .first()
    )

    if not app_obj:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        application_id=application_id,
        organization_id=org_id,
        action="Application Deleted",
        resource=app_obj.name,
        details=f"Deleted application {app_obj.name}"
    )

    db.delete(app_obj)
    db.commit()

    return {
        "success": True
    }
@router.get(
    "/{application_id}/api-keys",
    response_model=list[ApiKeyResponse]
)
async def get_application_api_keys(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):

    app_obj = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
            Application.organization_id == org_id
        )
        .first()
    )

    if not app_obj:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return (
        db.query(ApiKey)
        .filter(
            ApiKey.application_id == application_id,
            ApiKey.organization_id == org_id
        )
        .all()
    )

@router.post("/{application_id}/rotate-key")
async def rotate_api_key(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):

    app_obj = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
            Application.organization_id == org_id
        )
        .first()
    )

    if not app_obj:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    (
        db.query(ApiKey)
        .filter(
            ApiKey.application_id == application_id,
            ApiKey.organization_id == org_id
        )
        .update({"is_active": False})
    )

    raw_key = f"ps_{secrets.token_urlsafe(32)}"
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()

    api_key = ApiKey(
        application_id=application_id,
        user_id=current_user.id,
        organization_id=org_id,
        name=f"Rotated Key for {app_obj.name}",
        key_hash=hashed,
        prefix=raw_key[:8] + "...",
        is_active=True
    )

    db.add(api_key)
    db.commit()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        application_id=application_id,
        organization_id=org_id,
        action="API Key Rotated",
        resource=app_obj.name,
        details="Generated new API key"
    )

    return {
        "api_key": raw_key
    }

@router.get(
    "/{application_id}/detections",
    response_model=list[DetectionEventResponse]
)
async def get_application_detections(
    application_id: str,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):

    app_obj = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
            Application.organization_id == org_id
        )
        .first()
    )

    if not app_obj:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    detections = (
        db.query(Detection)
        .filter(
            Detection.application_id == application_id,
            Detection.organization_id == org_id
        )
        .order_by(
            Detection.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    return detections
@router.get("/{application_id}/metrics")
async def get_metrics(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):

    app_obj = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
            Application.organization_id == org_id
        )
        .first()
    )

    if not app_obj:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    metric = (
        db.query(UsageMetric)
        .filter(
            UsageMetric.application_id == application_id,
            UsageMetric.organization_id == org_id
        )
        .first()
    )

    if not metric:
        return {
            "total_requests": 0,
            "blocked_requests": 0,
            "success_rate": 100
        }

    return {
        "total_requests": metric.total_requests,
        "blocked_requests": metric.blocked_requests,
        "success_rate": round(
            (
                (
                    metric.total_requests -
                    metric.blocked_requests
                )
                /
                max(metric.total_requests, 1)
            ) * 100,
            2
        )
    }


@router.get(
    "/{application_id}/audit-logs",
    response_model=list[dict]
)
async def get_application_audit_logs(
    application_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):

    app_obj = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
            Application.organization_id == org_id
        )
        .first()
    )

    if not app_obj:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    audit_logs = (
        db.query(AuditLog)
        .filter(
            AuditLog.application_id == application_id,
            AuditLog.organization_id == org_id
        )
        .order_by(
            AuditLog.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    # Convert to dict for JSON response
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource": log.resource,
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in audit_logs
    ]