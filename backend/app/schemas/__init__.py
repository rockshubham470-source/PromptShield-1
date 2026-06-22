from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from typing import Any
# Auth schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=128)

class UserResponse(UserBase):
    id: str
    tier: str
    is_active: bool
    created_at: datetime
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse

class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    prefix: str
    created_at: datetime
    last_used_at: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True

class ApiKeyDetailResponse(ApiKeyResponse):
    key_hash: str

class DetectionRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    application_id: Optional[str] = None
    threshold: Optional[int] = None

class PatternDetail(BaseModel):
    name: str
    score: float
    matched_text: Optional[str]

class DetectionResponse(BaseModel):
    id: str
    is_safe: bool
    risk_score: float
    risk_level: str
    detected_patterns: List[str]
    processing_time_ms: int
    recommendations: List[str]

class DetectionEventResponse(BaseModel):
    id: str
    prompt: str
    risk_score: float
    risk_level: str
    detected_patterns: str
    processing_time_ms: int
    created_at: datetime

    class Config:
        from_attributes = True

class RuleCreate(BaseModel):
    name: str = Field(..., max_length=100)
    category: str = Field(..., max_length=50)
    patterns: List[str]
    weight: float = Field(0.8, ge=0.0, le=1.0)
    description: Optional[str] = Field(None, max_length=500)

class RuleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    patterns: Optional[List[str]] = None
    weight: Optional[float] = None
    is_enabled: Optional[bool] = None

class RuleResponse(BaseModel):
    id: str
    name: str
    category: str
    patterns: str
    weight: float
    is_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_detections: int
    critical_alerts: int
    safe_inputs: int
    avg_latency_ms: float
    detection_accuracy: float
    false_positive_rate: float

class AnalyticsResponse(BaseModel):
    period: str
    total_detections: int
    by_risk_level: dict
    top_patterns: List[dict]
    avg_accuracy: float
    avg_latency_ms: float

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None


class ApplicationCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    environment: str = Field("production", max_length=50)
    provider: str = Field("openai", max_length=50)


class ApplicationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    environment: Optional[str] = Field(None, max_length=50)
    provider: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    environment: str
    provider: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationMetricsResponse(BaseModel):
    total_requests: int
    blocked_requests: int
    success_rate: float


class ApplicationDetectionResponse(BaseModel):
    id: str
    risk_level: str
    risk_score: float
    processing_time_ms: int | None
    created_at: datetime

    class Config:
        from_attributes = True


class TelemetryCreate(BaseModel):
    hash: str = Field(..., max_length=64)  # Assuming SHA-256 hash
    score: int = Field(..., ge=0, le=100)
    timestamp: float
    tenantId: Optional[str] = Field(None, max_length=100)
    categories: Optional[List[Any]] = None
    riskLevel: Optional[str] = Field(None, max_length=20)