"""
Session management API — list and revoke active sessions across devices.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User, Session as UserSession

router = APIRouter(prefix="/sessions", tags=["sessions"])


class SessionResponse(BaseModel):
    id: str
    device_info: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    last_active_at: datetime
    is_current: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=list[SessionResponse])
def list_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """List all active (non-revoked, non-expired) sessions for current user."""
    now = datetime.utcnow()
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False,
        UserSession.expires_at > now,
    ).order_by(UserSession.last_active_at.desc()).all()

    from app.core.security import verify_token
    auth_header = request.headers.get("Authorization", "")
    current_jti = None
    if auth_header.startswith("Bearer "):
        payload = verify_token(auth_header[7:])
        if payload:
            current_jti = payload.get("jti")

    result = []
    for s in sessions:
        result.append({
            "id": s.id,
            "device_info": s.device_info,
            "ip_address": s.ip_address,
            "created_at": s.created_at,
            "last_active_at": s.last_active_at,
            "is_current": s.jti == current_jti,
        })
    return result


@router.delete("/{session_id}", status_code=204)
def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Revoke a specific session (log out a device)."""
    sess = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id,
    ).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")
    sess.is_revoked = True
    db.commit()


@router.delete("/", status_code=204)
def revoke_all_other_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Revoke all sessions except the current one."""
    from app.core.security import verify_token
    auth_header = request.headers.get("Authorization", "")
    current_jti = None
    if auth_header.startswith("Bearer "):
        payload = verify_token(auth_header[7:])
        if payload:
            current_jti = payload.get("jti")

    query = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False,
    )
    if current_jti:
        query = query.filter(UserSession.jti != current_jti)

    query.update({"is_revoked": True})
    db.commit()
