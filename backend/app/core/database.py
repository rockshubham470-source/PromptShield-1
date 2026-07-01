from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings

DATABASE_URL = settings.database_url

is_sqlite = DATABASE_URL.startswith("sqlite")

# SQLite: thread safety arg; PostgreSQL on serverless: NullPool prevents
# connection exhaustion (each Vercel invocation gets its own fresh connection).
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
