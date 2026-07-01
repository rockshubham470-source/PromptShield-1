from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import logging
import uuid
from app.api import application_keys
from app.core.config import settings
from app.core.database import engine
from app.models import Base
from app.api import (auth, detections, stats, rules, applications, telemetry, usage, billing, organizations)
from app.api import applications
from app.api import mfa, webhooks, team, ip_allowlist, password_reset, sessions
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
try:
    from prometheus_fastapi_instrumentator import Instrumentator
except ImportError:
    Instrumentator = None

try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    logging.warning("Database initialization skipped: %s", exc)

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="PromptShield Enterprise API",
)

# ── Correlation / Request-ID middleware ───────────────────────────────────────
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https: wss:;"
        return response

# Request size limiting middleware to prevent LPDOS
class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # Default 10MB
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_size:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request entity too large"}
            )

        # For chunked transfers, we'll rely on Starlette's body limit
        response: Response = await call_next(request)
        return response

app.add_middleware(RequestIDMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_size=5 * 1024 * 1024)  # 5MB limit

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Stricter rate limiting for auth endpoints
auth_limiter = Limiter(key_func=get_remote_address, default_limits=["5 per minute"])

trusted_hosts = list(settings.trusted_hosts or [])
trusted_hosts.extend([
    "promptshield-web-coral.vercel.app",
    "promptshield-api-topaz.vercel.app",
    "*.vercel.app",
])
trusted_hosts = list(dict.fromkeys(trusted_hosts))

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=trusted_hosts if trusted_hosts else ["*"]
)

# CORSMiddleware must be outermost (added last) so it handles preflight before auth
allowed_origins = list(settings.allowed_origins or [])
allowed_origins.extend([
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "https://51xkwxc6-3000.inc1.devtunnels.ms",
    "https://promptshield-web-coral.vercel.app",
    "https://promptshield-api-topaz.vercel.app",
])
if settings.frontend_url:
    allowed_origins.append(settings.frontend_url)
allowed_origins = list(dict.fromkeys(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
if Instrumentator is not None:
    try:
        Instrumentator().instrument(app).expose(app)
    except Exception as exc:
        logging.warning("Prometheus instrumentation skipped: %s", exc)

api_router = APIRouter(prefix=settings.api_prefix)

api_router.include_router(auth.router)
api_router.include_router(detections.router)
api_router.include_router(stats.router)
api_router.include_router(rules.router)
api_router.include_router(applications.router)
api_router.include_router(application_keys.router)
api_router.include_router(telemetry.router)
api_router.include_router(usage.router)
api_router.include_router(billing.router)
api_router.include_router(organizations.router)
# Enterprise SaaS endpoints
api_router.include_router(mfa.router)
api_router.include_router(webhooks.router)
api_router.include_router(team.router)
api_router.include_router(ip_allowlist.router)
api_router.include_router(password_reset.router)
api_router.include_router(sessions.router)
app.include_router(api_router)

@app.get("/health")
async def health_check():
    from app.core.database import engine
    db_status = "healthy"
    try:
        with engine.connect() as conn:
            conn.execute(__import__('sqlalchemy').text("SELECT 1"))
    except Exception:
        db_status = "degraded"
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "version": settings.api_version,
        "database": db_status,
        "environment": settings.environment,
    }

@app.get("/")
async def root():
    return {
        "message": "PromptShield API",
        "version": settings.api_version,
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    host = "127.0.0.1" if settings.environment == "development" else "0.0.0.0"
    uvicorn.run(app, host=host, port=8000)