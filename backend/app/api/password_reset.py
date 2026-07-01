"""
Password reset API.

Flow:
  1. POST /password-reset/request  — user provides email, gets a token (email link)
  2. POST /password-reset/confirm  — user submits token + new password
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.models import User, PasswordResetToken

router = APIRouter(prefix="/password-reset", tags=["password-reset"])

TOKEN_EXPIRY_MINUTES = 30

# ── schemas ──────────────────────────────────────────────────────────────────

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        return v


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/request", status_code=200)
def request_password_reset(body: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Always returns 200 to prevent email enumeration.
    In production, send the token via email. Here we return it for testability.
    """
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        # Invalidate previous tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at == None,
        ).delete()

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        prt = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRY_MINUTES),
        )
        db.add(prt)
        db.commit()

        return {
            "message": "If that email exists, a reset link has been sent.",
            "debug_token": raw_token,
        }

    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/confirm", status_code=200)
def confirm_password_reset(body: PasswordResetConfirm, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(body.token.encode()).hexdigest()

    prt = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at == None,
    ).first()

    if not prt:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if prt.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    user = db.query(User).filter(User.id == prt.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(body.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    prt.used_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Password reset successfully. You may now log in."}
