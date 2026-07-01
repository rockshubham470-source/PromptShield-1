from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from pydantic import BaseModel, EmailStr
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
import uuid

from app.core.database import get_db
from app.core.auth_fallback import (
    FallbackUser,
    create_fallback_organization,
    create_fallback_user,
    get_fallback_org_for_user,
    get_fallback_user_by_email,
    get_fallback_user_by_id,
    update_fallback_user,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    decode_token,
    is_account_locked,
    record_failed_login,
    reset_failed_logins,
    blacklist_token,
    is_token_blacklisted,
)
from app.core.org_middleware import get_current_org
from app.models import User, Organization, OrganizationUser

from app.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
)

from app.core.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

security = HTTPBearer()



async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")

    try:
        user = db.query(User).filter(User.id == user_id).first()
    except Exception:
        user = get_fallback_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user

@router.post(
    "/signup",
    response_model=TokenResponse
)
async def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    print("Signup endpoint called")
    try:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
    except Exception:
        existing_user = get_fallback_user_by_email(user_data.email)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    print("About to hash password")
    hashed_password = hash_password(user_data.password)
    print("Hashed password:", hashed_password)

    try:
        user = User(
            email=user_data.email,
            name=user_data.name,
            password_hash=hashed_password,
            tier="free"
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        org_name = f"{user.name}'s Organization"
        organization = Organization(name=org_name)
        db.add(organization)
        db.commit()
        db.refresh(organization)
        organization_user = OrganizationUser(
            organization_id=organization.id,
            user_id=user.id,
            role="owner"
        )
        db.add(organization_user)
        db.commit()
        user_payload = UserResponse.from_orm(user)
    except Exception:
        user = create_fallback_user(
            email=user_data.email,
            name=user_data.name,
            password_hash=hashed_password,
        )
        org = create_fallback_organization(user.id, f"{user.name}'s Organization")
        user.organization_id = org["id"]
        user.organization_name = org["name"]
        user_payload = UserResponse.from_orm(user)

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )

    refresh_token = create_refresh_token(data={"sub": user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user_payload.dict() if hasattr(user_payload, "dict") else user_payload,
    }


@router.post(
    "/login",
    response_model=TokenResponse
)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.email == credentials.email).first()
    except Exception:
        user = get_fallback_user_by_email(credentials.email)

    if not user:
        try:
            record_failed_login(db, User(id="00000000-0000-0000-0000-000000000000", email=credentials.email))
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if isinstance(user, User):
        if is_account_locked(user):
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account is temporarily locked due to too many failed login attempts"
            )

        if not verify_password(credentials.password, user.password_hash):
            record_failed_login(db, user)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        reset_failed_logins(db, user)

        org_user = db.query(OrganizationUser).filter(OrganizationUser.user_id == user.id).first()
        if not org_user:
            org_name = f"{user.name}'s Organization"
            organization = Organization(name=org_name)
            db.add(organization)
            db.commit()
            db.refresh(organization)

            org_user = OrganizationUser(
                organization_id=organization.id,
                user_id=user.id,
                role="owner"
            )
            db.add(org_user)
            db.commit()
        user_payload = UserResponse.from_orm(user)
    else:
        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        if getattr(user, "locked_until", None):
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account is temporarily locked due to too many failed login attempts"
            )
        if not get_fallback_org_for_user(user.id):
            create_fallback_organization(user.id, f"{user.name}'s Organization")
        update_fallback_user(user)
        user_payload = UserResponse.from_orm(user)

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )

    refresh_token = create_refresh_token(data={"sub": user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user_payload.dict() if hasattr(user_payload, "dict") else user_payload,
    }


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    body: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    payload = verify_token(body.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    try:
        user = db.query(User).filter(User.id == user_id).first()
    except Exception:
        user = get_fallback_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )
    refresh_token = create_refresh_token(data={"sub": user.id})
    user_payload = UserResponse.from_orm(user)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user_payload.dict() if hasattr(user_payload, "dict") else user_payload,
    }


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Logout user by blacklisting the token"""
    token = credentials.credentials

    payload = decode_token(token)
    if payload:
        jti = payload.get("jti")
        user_id = payload.get("sub")
        exp = payload.get("exp")

        if jti and user_id and exp:

            expires_at = datetime.fromtimestamp(exp)
            blacklist_token(db, jti, user_id, expires_at, reason="logout")

    return {"message": "Successfully logged out"}


@router.get(
    "/me",
    response_model=UserResponse
)
async def me(
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org),
    db: Session = Depends(get_db)
):
    try:
        org = db.query(Organization).filter(Organization.id == org_id).first()
    except Exception:
        org = None
    if org:
        current_user.organization_id = org.id
        current_user.organization_name = org.name
    else:
        current_user.organization_id = org_id
        current_user.organization_name = None
    return UserResponse.from_orm(current_user)


from typing import Optional as _Optional

class ProfileUpdateRequest(BaseModel):
    name: _Optional[str] = None
    email: _Optional[EmailStr] = None


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.email and body.email != current_user.email:
        conflict = db.query(User).filter(User.email == body.email, User.id != current_user.id).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already in use.")
        current_user.email = body.email
    if body.name is not None:
        current_user.name = body.name
    db.commit()
    db.refresh(current_user)
    return UserResponse.from_orm(current_user)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str



@router.post("/change-password", status_code=204)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="New password must be at least 8 characters.")
    current_user.password_hash = hash_password(body.new_password)
    db.commit()


import json as _json  # noqa: E402

_DEFAULT_NOTIF_PREFS = {
    "email_on_critical": True,
    "email_on_risky": False,
    "email_digest_daily": False,
    "slack_notifications": False,
}


def _get_notif_prefs(user: User) -> dict:
    raw = getattr(user, "notification_prefs_json", None)
    if not raw:
        return dict(_DEFAULT_NOTIF_PREFS)
    try:
        return _json.loads(raw)
    except Exception:
        return dict(_DEFAULT_NOTIF_PREFS)


@router.get("/notification-prefs")
async def get_notification_prefs(current_user: User = Depends(get_current_user)):
    return _get_notif_prefs(current_user)


@router.patch("/notification-prefs", status_code=204)
async def update_notification_prefs(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prefs = _get_notif_prefs(current_user)
    prefs.update({k: v for k, v in body.items() if k in _DEFAULT_NOTIF_PREFS})
    if hasattr(current_user, "notification_prefs_json"):
        current_user.notification_prefs_json = _json.dumps(prefs)
        db.commit()

@router.delete("/account", status_code=204)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.delete(current_user)
    db.commit()