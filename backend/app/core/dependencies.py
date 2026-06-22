import hashlib
from datetime import datetime, timezone
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models import ApiKey, User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """JWT-only auth — used by dashboard/UI routes."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return await _user_from_jwt(credentials.credentials, db)


# ─── API-key-aware auth (for /detections/analyze) ───────────────────────────

class _APIKeyOrBearer(HTTPBearer):
    """Accept both JWT Bearer tokens and ps_… API keys."""
    def __init__(self):
        super().__init__(auto_error=False)

    async def __call__(self, request: Request):  # type: ignore[override]
        # 1. Try standard Authorization header
        creds = await super().__call__(request)
        if creds:
            return creds.credentials
        # 2. Try X-API-Key header
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return api_key
        return None


_api_key_or_bearer = _APIKeyOrBearer()


async def get_caller(
    token: Optional[str] = Depends(_api_key_or_bearer),
    db: Session = Depends(get_db),
) -> Tuple[User, str]:
    """
    Returns (user, org_id).
    Accepts:
      • Authorization: Bearer <JWT>
      • Authorization: Bearer ps_<api_key>
      • X-API-Key: ps_<api_key>
    """
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # API key path: starts with "ps_"
    if token.startswith("ps_"):
        return await _resolve_api_key(token, db)

    # JWT path
    user = await _user_from_jwt(token, db)
    # org_id from JWT payload
    payload = verify_token(token) or {}
    org_id = payload.get("org_id", "")
    return user, org_id


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _user_from_jwt(token: str, db: Session) -> User:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def _resolve_api_key(raw_key: str, db: Session) -> Tuple[User, str]:
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    api_key: Optional[ApiKey] = (
        db.query(ApiKey)
        .filter(ApiKey.key_hash == key_hash, ApiKey.is_active == True)  # noqa: E712
        .first()
    )
    if not api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or inactive API key")

    user = db.query(User).filter(User.id == api_key.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key owner not found")

    # Record usage without blocking the request
    api_key.last_used_at = datetime.now(timezone.utc)
    db.commit()

    return user, api_key.organization_id