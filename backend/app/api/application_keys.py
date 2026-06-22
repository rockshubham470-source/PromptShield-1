import secrets
import hashlib
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import ApiKey, Application
from app.api.auth import get_current_user
from app.core.org_middleware import get_current_org
from app.models import User
from app.utils.audit_log import create_audit_log

router = APIRouter(
    prefix="/application-keys",
    tags=["Application Keys"]
)

@router.post("/{application_id}")
def create_key(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id,
        Application.organization_id == org_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found or access denied"
        )

    raw_key = f"ps_{secrets.token_urlsafe(32)}"
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()

    api_key = ApiKey(
        application_id=application_id,
        user_id=current_user.id,
        organization_id=org_id,
        name="Default Key",
        key_hash=hashed,
        prefix=raw_key[:8] + "..." if len(raw_key) > 8 else raw_key
    )

    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    create_audit_log(
        db=db,
        user_id=current_user.id,
        application_id=application_id,
        organization_id=org_id,
        action="API_KEY_CREATED",
        resource=f"api_key:{api_key.id}",
        details=f"Created API key for application {application_id}"
    )

    return {
        "api_key": raw_key
    }


@router.delete("/{key_id}")
def delete_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):
    api_key = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.user_id == current_user.id,
        ApiKey.organization_id == org_id
    ).first()

    if not api_key:
        raise HTTPException(
            status_code=404,
            detail="API key not found or access denied"
        )
    application_id = api_key.application_id
    api_key.is_active = False
    db.commit()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        application_id=application_id,
        organization_id=org_id,
        action="API_KEY_DEACTIVATED",
        resource=f"api_key:{api_key.id}",
        details=f"Deactivated API key for application {application_id}" if application_id else "Deactivated API key"
    )

    return {"message": "API key deactivated successfully"}