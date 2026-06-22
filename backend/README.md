# PromptShield Backend API

Production-ready FastAPI backend for PromptShield enterprise platform.

## Features

✅ User authentication (signup/login/JWT)
✅ Prompt injection detection API
✅ Batch processing
✅ Analytics and statistics
✅ Rule management
✅ API key management
✅ Detection history
✅ PostgreSQL database
✅ Redis caching
✅ CORS support
✅ Docker deployment

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 13+
- Redis 6+

### Installation

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Initialize database
python init_db.py

# Run server
uvicorn app.main:app --reload
```

Server runs on http://localhost:8000

### API Documentation

Visit http://localhost:8000/docs (Swagger UI)
or http://localhost:8000/redoc (ReDoc)

## Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Backend: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## API Endpoints

### Authentication

```
POST   /api/auth/signup           - Register user
POST   /api/auth/login            - Login user
GET    /api/auth/me               - Get current user
```

### Detection

```
POST   /api/detections/analyze           - Analyze single prompt
POST   /api/detections/analyze-batch     - Analyze multiple prompts
GET    /api/detections/                  - List detection events
GET    /api/detections/{detection_id}    - Get detection details
```

### Statistics

```
GET    /api/stats/dashboard       - Dashboard statistics
GET    /api/stats/analytics       - Analytics data
```

### Rules

```
GET    /api/rules/                - List rules
GET    /api/rules/{rule_id}       - Get rule details
```

### API Keys

```
GET    /api/api-keys/             - List user's API keys
POST   /api/api-keys/             - Create new API key
DELETE /api/api-keys/{key_id}     - Delete API key
```

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── detections.py   # Detection endpoints
│   │   ├── stats.py        # Statistics endpoints
│   │   └── rules.py        # Rule endpoints
│   ├── core/               # Core utilities
│   │   ├── config.py       # Settings
│   │   ├── security.py     # JWT & password hashing
│   │   └── database.py     # Database connection
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   └── main.py            # FastAPI app
├── tests/                  # Tests
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables
├── docker-compose.yml     # Docker services
├── Dockerfile             # API container
└── init_db.py            # Database initialization
```

## Database Schema

### Users
- id: UUID (primary key)
- email: String (unique)
- name: String
- password_hash: String
- tier: String (free, professional, business, enterprise)
- is_active: Boolean
- created_at: DateTime

### API Keys
- id: UUID
- user_id: UUID (FK)
- name: String
- key_hash: String
- prefix: String (display only)
- is_active: Boolean
- created_at: DateTime
- last_used_at: DateTime

### Detections
- id: UUID
- user_id: UUID (FK)
- prompt: Text
- risk_score: Float (0-100)
- risk_level: String (safe/caution/risky/critical)
- detected_patterns: JSON array
- processing_time_ms: Integer
- created_at: DateTime

### Rules
- id: UUID
- name: String (unique)
- category: String
- patterns: JSON array
- weight: Float (0-1)
- is_enabled: Boolean
- created_at: DateTime

## Configuration

Set these in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/promptshield

# JWT
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis
REDIS_URL=redis://localhost:6379

# Detection
DEFAULT_RISK_THRESHOLD=60

# Environment
DEBUG=false
ENVIRONMENT=production
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app tests/

# Specific test
pytest tests/test_auth.py
```

## Deployment

### Production Deployment

```bash
# Build image
docker build -t promptshield-backend:latest .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e SECRET_KEY=... \
  promptshield-backend:latest
```

### Environment Variables

**Required for production**:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Random secret key (use `openssl rand -hex 32`)
- `REDIS_URL` - Redis connection string
- `ALLOWED_ORIGINS` - CORS allowed origins

### Database Migrations

```bash
# Using Alembic (optional)
alembic upgrade head
```

## Performance

**Metrics**:
- Latency: <100ms for most requests
- Throughput: 1000+ req/sec
- Database queries: Optimized with indexes
- Caching: Redis for session/results

**Optimization**:
- Connection pooling (SQLAlchemy)
- Query optimization (indexed columns)
- Async endpoints (FastAPI)
- Request caching

## Security

- JWT token-based auth
- Password hashing (bcrypt)
- CORS enabled
- Trusted host middleware
- SQL injection prevention (ORM)
- Rate limiting ready
- Audit logging

## Monitoring

Endpoints:
- `/health` - Health check
- `/docs` - API documentation
- `/redoc` - API documentation (ReDoc)

**Logs** can be integrated with:
- ELK Stack
- Datadog
- New Relic
- CloudWatch

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT - See [LICENSE](../LICENSE)

## Support

- Docs: [docs/](../docs/)
- Issues: GitHub Issues
- Email: support@promptshield.io
