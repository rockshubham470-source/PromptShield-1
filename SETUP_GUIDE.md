# PromptShield Complete System - Setup & Run Guide

## System Architecture

```
Frontend (React)    ←→    Backend API (FastAPI)    ←→    Database (PostgreSQL)
:3000               :8000                               :5432
                                                  ↓
                                            Detection Engine
                                         (Python SDK, <60ms)
```

## 🚀 Quick Start (5 minutes)

### Option 1: Using Docker Compose (Recommended)

```bash
# Start all services at once
cd backend
docker-compose up -d

# Initialize database
docker exec backend python init_db.py

# In another terminal, start frontend
cd web-app
npm install
npm run dev
```

Then open:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Initialize database (requires PostgreSQL running)
python init_db.py

# Start server
python run.py
# or: uvicorn app.main:app --reload
```

Backend runs on **http://localhost:8000**

#### Frontend Setup

```bash
cd web-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on **http://localhost:3000**

## 📋 Prerequisites

### For Docker Compose
- Docker & Docker Compose
- 2GB free disk space

### For Manual Setup
- Python 3.11+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+ (optional, for caching)

## 🔧 Configuration

### Backend Environment (.env)

```env
# Database (required for manual setup)
DATABASE_URL=postgresql://promptshield:password@localhost:5432/promptshield

# JWT
SECRET_KEY=your-secret-key-change-in-production

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Detection settings
DEFAULT_RISK_THRESHOLD=60
ML_DETECTION_ENABLED=true

# CORS
ALLOWED_ORIGINS=["http://localhost:3000"]

# Debug
DEBUG=true
ENVIRONMENT=development
```

### Frontend Environment (.env)

In `web-app/` (optional):

```env
VITE_API_URL=http://localhost:8000
```

## 📊 Database Setup

### With Docker Compose
Automatic - PostgreSQL starts in container

### Manual PostgreSQL Setup

```bash
# macOS (Homebrew)
brew install postgresql
brew services start postgresql
createdb promptshield

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql
sudo -u postgres createdb promptshield

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

Then set `DATABASE_URL` in `.env`:

```bash
DATABASE_URL=postgresql://localhost:5432/promptshield
```

## ✅ Verify Installation

### Backend Health Check

```bash
curl http://localhost:8000/health
# Response: {"status":"healthy","version":"1.0.0"}
```

### API Documentation

Open in browser:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Frontend Access

Open in browser:
- **Dashboard**: http://localhost:3000

## 🔑 Demo Credentials

Use these to login:

```
Email:    demo@example.com
Password: demo123
```

## 📡 API Endpoints

### Authentication

```bash
# Signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"User","password":"pass123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

### Detection

```bash
# Analyze prompt
curl -X POST http://localhost:8000/api/detections/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Your prompt here"}'

# List detections
curl http://localhost:8000/api/detections/

# Get statistics
curl http://localhost:8000/api/stats/dashboard
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Run command in container
docker-compose exec backend python init_db.py

# Remove volumes (clean database)
docker-compose down -v
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# With coverage
pytest --cov=app

# Specific test
pytest tests/test_api.py
```

### Frontend Tests (if added)

```bash
cd web-app

# Run tests
npm test

# Watch mode
npm test -- --watch
```

## 📚 Project Structure

```
promptshield/
├── frontend/
│   ├── web-app/          # React + TypeScript SaaS dashboard
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── ...
│
├── backend/              # FastAPI backend server
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── core/        # Config, security, database
│   ├── requirements.txt
│   ├── docker-compose.yml
│   └── Dockerfile
│
├── python-sdk/          # Python detection SDK
├── js-sdk/             # JavaScript detection SDK
├── docs/               # Documentation
└── README.md
```

## 🔍 File Locations

**Frontend**:
- Dashboard: `web-app/src/pages/Dashboard.tsx`
- API integration: `web-app/src/lib/api.ts`
- Authentication: `web-app/src/lib/auth.ts`

**Backend**:
- Main app: `backend/app/main.py`
- Routes: `backend/app/api/`
- Models: `backend/app/models/__init__.py`
- Config: `backend/app/core/config.py`

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>

# Or use different port
npm run dev -- --port 3001
```

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U promptshield -d promptshield

# Or with Docker
docker-compose logs postgres
```

### Frontend Can't Connect to Backend

- Check backend is running: `curl http://localhost:8000/health`
- Check API URL in code: `src/lib/api.ts`
- Check CORS settings: `backend/app/core/config.py`

### Module Not Found

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd web-app
npm install
```

## 📊 Development Workflow

### Making Changes

**Frontend**:
```bash
cd web-app
npm run dev
# Changes auto-reload
```

**Backend**:
```bash
cd backend
uvicorn app.main:app --reload
# Changes auto-reload
```

### Testing Changes

```bash
# Frontend
npm run type-check  # Check TypeScript
npm run lint        # Lint code

# Backend
pytest              # Run tests
```

### Building for Production

**Frontend**:
```bash
cd web-app
npm run build
# Output: dist/
```

**Backend**:
```bash
cd backend
docker build -t promptshield-backend:latest .
```

## 🌐 Deployment

### Local Testing Complete Stack

```bash
# Terminal 1: Backend
cd backend
docker-compose up

# Terminal 2: Frontend
cd web-app
npm run dev

# Terminal 3: Open browser
# Frontend: http://localhost:3000
# API: http://localhost:8000/docs
```

### Production Deployment

See:
- `backend/README.md` - Backend deployment
- `web-app/README.md` - Frontend deployment
- `DEPLOYMENT.md` - Full deployment guide

## 📞 Support

- **Issues**: Check GitHub Issues
- **Docs**: See `docs/` folder
- **API Docs**: http://localhost:8000/docs
- **Email**: support@promptshield.io

## ✨ Next Steps

After setup:

1. **Explore Dashboard**: http://localhost:3000
2. **Test API**: http://localhost:8000/docs
3. **Check Database**: Connect with pgAdmin or CLI
4. **Read Docs**: See `docs/` folder
5. **Deploy**: Follow `DEPLOYMENT.md`

---

**PromptShield Platform v1.0**  
Last Updated: 2026-06-04
