from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    
    # API
    api_title: str = "PromptShield API"
    api_version: str = "1.0.0"
    api_prefix: str = "/api"
    
    # Database (SQLite for dev, PostgreSQL for prod)
    database_url: str = "sqlite:///./promptshield.db"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Detection
    ml_detection_enabled: bool = True
    default_risk_threshold: int = 60
    cache_size: int = 1000
    
    # CORS
    allowed_origins: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
    ]
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
