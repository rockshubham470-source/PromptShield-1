from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
import uuid

from app.core.database import get_db
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

    user = db.query(User).filter(
        User.id == user_id
    ).first()

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
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    print("About to hash password")
    hashed_password = hash_password(user_data.password)
    print("Hashed password:", hashed_password)

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
    organization = Organization(
        name=org_name
    )
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

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(
            minutes=settings.access_token_expire_minutes
        )
    )

    refresh_token = create_refresh_token(
        data={"sub": user.id}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": UserResponse.from_orm(user)
    }


@router.post(
    "/login",
    response_model=TokenResponse
)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == credentials.email
    ).first()

    if not user:
        record_failed_login(db, User(id="00000000-0000-0000-0000-000000000000", email=credentials.email))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

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
        organization = Organization(
            name=org_name
        )
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

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(
            minutes=settings.access_token_expire_minutes
        )
    )

    refresh_token = create_refresh_token(
        data={"sub": user.id}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": UserResponse.from_orm(user)
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
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if org:
        current_user.organization_id = org.id
        current_user.organization_name = org.name
    else:
        current_user.organization_id = org_id
        current_user.organization_name = None
    return UserResponse.from_orm(current_user)