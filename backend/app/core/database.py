import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings


def _resolve_database_url() -> str:
    configured_url = settings.database_url or ""
    is_serverless = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
    is_production = str(settings.environment).lower() == "production"
    looks_like_postgres = any(marker in configured_url.lower() for marker in ["postgres", "supabase", "postgresql"])
    return configured_url or "sqlite:///./promptshield.db"


DATABASE_URL = _resolve_database_url()

is_sqlite = DATABASE_URL.startswith("sqlite")
if is_sqlite:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.debug,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        echo=settings.debug,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()