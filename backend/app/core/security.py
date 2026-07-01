from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import uuid
import bcrypt
from app.core.config import settings
from sqlalchemy.orm import Session
from app.models import User, TokenBlacklist

BCRYPT_ROUTES = 12

def _truncate_to_72_bytes(s: str) -> bytes:
    """Truncate a string to at most 72 bytes UTF-8"""
    encoded = s.encode('utf-8')
    if len(encoded) > 72:
        encoded = encoded[:72]
    return encoded


def hash_password(password: str) -> str:
    """Hash a password"""
    truncated_password = _truncate_to_72_bytes(password)
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUTES)
    hashed = bcrypt.hashpw(truncated_password, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against hash"""
    truncated_password = _truncate_to_72_bytes(plain_password)
    return bcrypt.checkpw(truncated_password, hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "jti": str(uuid.uuid4()), "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "jti": str(uuid.uuid4()), "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def decode_token(token: str) -> Optional[dict]:
    """Decode JWT token without verification"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except Exception:
        return None


def is_account_locked(user: User) -> bool:
    """Check if user account is locked due to failed login attempts"""
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        return True
    return False


def record_failed_login(db: Session, user: User) -> None:
    """Record a failed login attempt and lock account if threshold reached"""
    if user.failed_login_attempts is None:
        user.failed_login_attempts = 0
    user.failed_login_attempts += 1
    if user.failed_login_attempts >= 5:
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)

    PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000"
    if user.id != PLACEHOLDER_USER_ID:
        db.add(user)
        db.commit()


def reset_failed_logins(db: Session, user: User) -> None:
    """Reset failed login attempts on successful login"""
    failed_attempts = user.failed_login_attempts if user.failed_login_attempts is not None else 0
    if failed_attempts > 0 or user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None
        PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000"
        if user.id != PLACEHOLDER_USER_ID:
            db.add(user)
            db.commit()


def blacklist_token(db: Session, token_jti: str, user_id: str, expires_at: datetime, reason: str = "logout") -> None:
    """Add token to blacklist for revocation"""
    blacklist_entry = TokenBlacklist(
        jti=token_jti,
        user_id=user_id,
        expires_at=expires_at,
        reason=reason
    )
    db.add(blacklist_entry)
    db.commit()


def is_token_blacklisted(db: Session, token_jti: str) -> bool:
    """Check if token is in blacklist"""
    blacklist_entry = db.query(TokenBlacklist).filter(
        TokenBlacklist.jti == token_jti,
        TokenBlacklist.expires_at > datetime.now(timezone.utc)
    ).first()
    return blacklist_entry is not None


def cleanup_expired_blacklisted_tokens(db: Session) -> None:
    """Remove expired tokens from blacklist (cleanup function)"""
    db.query(TokenBlacklist).filter(
        TokenBlacklist.expires_at <= datetime.now(timezone.utc)
    ).delete()
    db.commit()
