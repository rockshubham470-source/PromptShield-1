# PromptShield Complete Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     End Users                                    │
└────────────────┬────────────────────────────────────┬─────────────┘
                 │                                    │
        ┌────────▼─────────┐                 ┌─────────▼──────────┐
        │ Web Dashboard    │                 │ API Integrations   │
        │ (React/TS)       │                 │ (Python/JS SDK)    │
        │ - Analytics      │                 │ - Direct embed     │
        │ - Management     │                 │ - Microservice     │
        │ - Detections     │                 │ - Gateway          │
        └────────┬─────────┘                 └─────────┬──────────┘
                 │                                    │
                 └────────────────┬───────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   API Server (Backend)    │
                    │  - Authentication         │
                    │  - Webhooks               │
                    │  - Analytics              │
                    │  - Rule Management        │
                    └──────────────┬────────────┘
                                   │
        ┌──────────────────────────▼──────────────────────────┐
        │        PromptShield Detection Engine                │
        │  ┌──────────────┐      ┌──────────────┐             │
        │  │  Heuristic   │      │  ML Analyzer │             │
        │  │  Detection   │  +   │  (ONNX)      │  =  Score   │
        │  │  (8 rules)   │      │  (Semantic)  │             │
        │  └──────────────┘      └──────────────┘             │
        │                                                      │
        │  - Detection Rules                                  │
        │  - Caching Layer (LRU)                             │
        │  - Performance Monitoring                          │
        └──────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────▼──────────────────────────┐
        │         Logging & Persistence                       │
        │  - PostgreSQL (Events, Users, Keys)                │
        │  - Redis (Caching, Sessions)                       │
        │  - Elasticsearch (Detection Logs)                  │
        │  - S3 (Backups)                                    │
        └──────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Frontend (Web Dashboard)

**Technology**: React 18, TypeScript, Tailwind CSS, Vite

**Features**:
- Real-time analytics dashboard
- Detection event viewer
- API key management
- Rule configuration
- User settings
- Authentication

**Pages**:
- `/` - Dashboard with metrics and trends
- `/detections` - Detection event list and filtering
- `/analytics` - Advanced analytics and insights
- `/api-keys` - API key management
- `/rules` - Detection rule management
- `/settings` - User and app settings
- `/login` - Authentication

**State Management**: Zustand for global state

**HTTP Client**: Axios with interceptors

**Location**: `web-app/`

### 2. Backend API Server

**Technology**: Python (FastAPI), Node.js (Express), or Go

**Endpoints**:
```
POST   /api/auth/login              - User login
POST   /api/auth/signup             - User registration
GET    /api/auth/me                 - Current user info

GET    /api/stats                   - Dashboard statistics
GET    /api/detections              - List detections
POST   /api/detections/analyze      - Analyze prompt

GET    /api/analytics               - Analytics data
GET    /api/rules                   - List rules
POST   /api/rules                   - Create rule
PUT    /api/rules/:id               - Update rule

GET    /api/api-keys                - List API keys
POST   /api/api-keys                - Create key
DELETE /api/api-keys/:id            - Delete key
```

**Responsibilities**:
- User authentication & JWT tokens
- Request routing to detection engine
- Result aggregation & formatting
- Webhook management
- Analytics aggregation
- Audit logging

### 3. Detection Engine

**Core Logic**: Python SDK or JavaScript SDK

**Input**: User prompt/text

**Processing**:
1. **Normalization**
   - Encoding detection
   - Unicode normalization
   - Text cleanup

2. **Heuristic Analysis** (< 1ms)
   - 8 detection rules
   - Pattern matching
   - Scoring: 0-100

3. **ML Analysis** (10-50ms optional)
   - ONNX model inference
   - Semantic analysis
   - Token frequency analysis

4. **Result Aggregation**
   - Weighted score merging
   - Risk level assignment
   - Recommendation generation

**Output**: AnalysisResult
- `is_safe`: boolean
- `risk_score`: 0-100
- `risk_level`: safe/caution/risky/critical
- `detected_patterns`: string[]
- `recommendations`: string[]
- `processing_time_ms`: number

**Caching**: LRU cache (1000 entries default)

### 4. Data Storage

**PostgreSQL**:
```sql
users (id, email, password_hash, name, tier)
api_keys (id, user_id, key_hash, name, created_at)
detections (id, user_id, prompt, risk_score, patterns, created_at)
rules (id, name, category, patterns, weight, enabled)
```

**Redis**:
- Session cache
- Rate limiting counters
- Detection cache (optional)
- Job queue

**Elasticsearch**:
- Detection event logs
- Full-text search
- Analytics aggregations

### 5. SDKs (Python & JavaScript)

**Python**: pip install promptshield

```python
from promptshield import PromptDetector

detector = PromptDetector()
result = detector.analyze("prompt")
```

**JavaScript**: npm install promptshield

```javascript
import { PromptDetector } from 'promptshield';

const detector = new PromptDetector();
const result = await detector.analyze("prompt");
```

Both provide:
- Core detection logic
- Caching
- Batch processing
- Custom rules
- Event callbacks

## Deployment Architecture

### Development

```
Local Machine
├── npm run dev (Dashboard on :3000)
├── npm run dev:backend (API on :8000)
└── npm run dev:detector (Detector service)
```

### Staging

```
AWS/GCP
├── RDS: PostgreSQL
├── ElastiCache: Redis
├── ALB: Load balancer
├── ECS: Dashboard (multi-region)
├── ECS: API server (multi-region)
└── Lambda: Detector (auto-scaling)
```

### Production

```
Multi-Region Deployment
├── Region 1 (US)
│  ├── Dashboard
│  ├── API (3-5 instances)
│  ├── Detector (auto-scaling)
│  └── DB (Primary)
├── Region 2 (EU)
│  ├── Dashboard (replica)
│  ├── API (3-5 instances)
│  ├── Detector (auto-scaling)
│  └── DB (Replica)
└── Region 3 (APAC)
   ├── Dashboard (replica)
   ├── API (2-3 instances)
   ├── Detector (auto-scaling)
   └── DB (Replica)

Global:
├── CloudFront: CDN
├── Route 53: Global routing
├── WAF: DDoS protection
└── VPC: Network security
```

## Data Flow

### Request Processing

```
1. User Input
   └─> Web Dashboard
       └─> API Request (with Auth Token)
           └─> Backend API Server
               ├─> Parse & Validate
               ├─> Check Cache
               └─> If miss: Call Detection Engine
                   ├─> Normalize Text
                   ├─> Heuristic Analysis
                   ├─> ML Analysis (optional)
                   ├─> Aggregate Results
                   └─> Cache Result
                       └─> Return AnalysisResult
                           └─> Log Event
                               └─> API Response
                                   └─> Dashboard Update
                                       └─> Display to User
```

### Latency Breakdown

- Web Request: 5-10ms (network)
- API Processing: 5-10ms (validation, cache check)
- **Heuristic Detection: < 1ms**
- **ML Analysis: 10-50ms** (if enabled)
- **Caching: < 1ms** (on hit)
- Response: 5-10ms (network)

**P95 Total**: 60-80ms (with ML)
**P95 Total**: 10-20ms (heuristic only, cache hit)

## Security Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (HTTPS)                     │
│  - Content Security Policy (CSP)             │
│  - CORS restrictions                        │
│  - Secure cookies (HttpOnly, SameSite)      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         API Gateway / WAF                    │
│  - DDoS protection                          │
│  - Rate limiting                            │
│  - IP whitelist (enterprise)                │
│  - Certificate pinning                      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         Backend Services (Private Network)   │
│  - JWT token validation                     │
│  - API key verification                     │
│  - Request signing                          │
│  - Audit logging                            │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         Detection Engine                     │
│  - Sandboxed execution                      │
│  - Resource limits                          │
│  - Model verification (signed)              │
│  - Rule validation                          │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         Data Storage                         │
│  - Encryption at rest (AES-256)             │
│  - Encryption in transit (TLS 1.3)          │
│  - Access controls (IAM)                    │
│  - Backup encryption                        │
└──────────────────────────────────────────────┘
```

## Monitoring & Observability

**Metrics**:
- Detection accuracy
- False positive rate
- Latency (p50, p95, p99)
- Throughput (req/sec)
- Cache hit rate

**Logging**:
- API access logs
- Detection events
- Error tracking
- Audit trail

**Alerts**:
- High false positive rate
- Performance degradation
- API errors
- Security events

**Tools**:
- Prometheus: Metrics collection
- Grafana: Visualization
- ELK Stack: Logging
- Datadog/New Relic: APM

## Scalability

**Horizontal Scaling**:
- Stateless API servers (load balanced)
- Detector as lambda/serverless
- Database read replicas
- CDN for frontend

**Vertical Scaling**:
- GPU-accelerated ML inference
- Multi-core detection processing
- Memory optimization for models

**Expected Capacity**:
- 1000+ req/sec per region
- 100K+ daily detections
- 10K+ concurrent users
- 1 million+ monthly API calls

## Next Steps

1. ✅ Create frontend dashboard
2. ⏭️ Build backend API server
3. ⏭️ Setup database schema
4. ⏭️ Implement authentication
5. ⏭️ Deploy to staging
6. ⏭️ Load testing
7. ⏭️ Production deployment
8. ⏭️ Monitor & optimize

---

*Platform Architecture: PromptShield v1.0*
*Last Updated: 2026-06-04*
