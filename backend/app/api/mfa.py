"""
MFA (Multi-Factor Authentication) API — TOTP-based 2FA.

Flow:
  1. POST /mfa/setup        → returns provisioning URI + backup codes (MFA not active yet)
  2. POST /mfa/verify-setup → user submits first TOTP code to activate MFA
  3. POST /mfa/disable      → deactivate MFA (requires current TOTP code)
  4. GET  /mfa/status       → returns enabled/not-enabled

On future logins, if MFA is enabled the auth endpoint will return
{ mfa_required: true, mfa_session_token: "…" } and the client must call
POST /mfa/challenge with the TOTP code to exchange for a real access token.
"""
import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

import pyotp
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.models import User, MFASecret

router = APIRouter(prefix="/mfa", tags=["mfa"])

# ── schemas ──────────────────────────────────────────────────────────────────

class MFASetupResponse(BaseModel):
    provisioning_uri: str
    secret: str           
    backup_codes: list[str]

class MFAVerifySetupRequest(BaseModel):
    code: str

class MFADisableRequest(BaseModel):
    code: str             

class MFAStatusResponse(BaseModel):
    enabled: bool
    enabled_at: Optional[datetime]


# ── helpers ───────────────────────────────────────────────────────────────────

def _generate_backup_codes(n: int = 8) -> tuple[list[str], list[str]]:
    """Return (plaintext_codes, hashed_codes)."""
    plain = [secrets.token_hex(5).upper() for _ in range(n)]
    hashed = [hashlib.sha256(c.encode()).hexdigest() for c in plain]
    return plain, hashed


def _verify_code_or_backup(mfa: MFASecret, code: str) -> bool:
    """Return True if *code* is a valid TOTP or unused backup code."""
    totp = pyotp.TOTP(mfa.secret)
    if totp.verify(code, valid_window=1):
        return True
    if mfa.backup_codes:
        backups: list[str] = json.loads(mfa.backup_codes)
        code_hash = hashlib.sha256(code.upper().encode()).hexdigest()
        if code_hash in backups:
            backups.remove(code_hash)
            mfa.backup_codes = json.dumps(backups)
            return True
    return False


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status", response_model=MFAStatusResponse)
def mfa_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mfa = db.query(MFASecret).filter(MFASecret.user_id == current_user.id).first()
    if not mfa or not mfa.is_enabled:
        return {"enabled": False, "enabled_at": None}
    return {"enabled": True, "enabled_at": mfa.enabled_at}


@router.post("/setup", response_model=MFASetupResponse)
def setup_mfa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a new TOTP secret (does NOT activate MFA yet)."""
    existing = db.query(MFASecret).filter(MFASecret.user_id == current_user.id).first()
    if existing and existing.is_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled. Disable it first.")

    secret = pyotp.random_base32()
    plain_codes, hashed_codes = _generate_backup_codes()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=current_user.email, issuer_name="PromptShield")

    if existing:
        existing.secret = secret
        existing.backup_codes = json.dumps(hashed_codes)
        existing.is_enabled = False
    else:
        db.add(MFASecret(
            user_id=current_user.id,
            secret=secret,
            backup_codes=json.dumps(hashed_codes),
            is_enabled=False,
        ))
    db.commit()

    return {"provisioning_uri": uri, "secret": secret, "backup_codes": plain_codes}


@router.post("/verify-setup", status_code=200)
def verify_setup(
    body: MFAVerifySetupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Activate MFA after user has scanned the QR code and verified a code."""
    mfa = db.query(MFASecret).filter(MFASecret.user_id == current_user.id).first()
    if not mfa:
        raise HTTPException(status_code=400, detail="Call /mfa/setup first.")

    totp = pyotp.TOTP(mfa.secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid TOTP code.")

    mfa.is_enabled = True
    mfa.enabled_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "MFA enabled successfully."}


@router.post("/disable", status_code=200)
def disable_mfa(
    body: MFADisableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Disable MFA. Requires a valid TOTP code or backup code."""
    mfa = db.query(MFASecret).filter(MFASecret.user_id == current_user.id).first()
    if not mfa or not mfa.is_enabled:
        raise HTTPException(status_code=400, detail="MFA is not enabled.")

    if not _verify_code_or_backup(mfa, body.code):
        raise HTTPException(status_code=400, detail="Invalid code.")

    mfa.is_enabled = False
    db.commit()
    return {"message": "MFA disabled successfully."}


@router.post("/regenerate-backup-codes", status_code=200)
def regenerate_backup_codes(
    body: MFAVerifySetupRequest,  # reuse — requires current TOTP
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Regenerate backup codes. Returns new plaintext codes (shown ONCE)."""
    mfa = db.query(MFASecret).filter(MFASecret.user_id == current_user.id).first()
    if not mfa or not mfa.is_enabled:
        raise HTTPException(status_code=400, detail="MFA is not enabled.")

    totp = pyotp.TOTP(mfa.secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid TOTP code.")

    plain, hashed = _generate_backup_codes()
    mfa.backup_codes = json.dumps(hashed)
    db.commit()
    return {"backup_codes": plain}
