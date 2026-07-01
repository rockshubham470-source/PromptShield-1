from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    """Application settings"""
    
    # API
    api_title: str = "PromptShield API"
    api_version: str = "1.0.0"
    api_prefix: str = "/api"
    
    # Database (SQLite for dev, PostgreSQL/Supabase for prod)
    database_url: str = "sqlite:///./promptshield.db"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Redis (optional)
    redis_url: str = "redis://localhost:6379"
    
    # Detection
    ml_detection_enabled: bool = True
    default_risk_threshold: int = 60
    cache_size: int = 1000
    
    # CORS — comma-separated list of allowed origins via ALLOWED_ORIGINS env var
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
    ]

    # Frontend Vercel URL (set in production, e.g. https://your-app.vercel.app)
    frontend_url: str = ""

    # Trusted hosts (comma-separated) — set to * to allow all in serverless
    trusted_hosts: List[str] = ["localhost", "127.0.0.1"]
    
    # Environment
    environment: str = "development"
    debug: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
