from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import secrets
from app.core.database import get_db
from app.core.security import hash_password
from app.models import ApiKey
from app.schemas import ApiKeyCreate, ApiKeyResponse

def get_current_user_id(token: str = None) -> str:
    """Mock current user"""
    return "demo-user-id"

def generate_api_key() -> tuple[str, str]:
    """Generate API key and prefix"""
    random_part = secrets.token_urlsafe(32)
    prefix = f"ps_live_{random_part[:16]}"
    full_key = f"{prefix}{random_part}"
    return full_key, prefix