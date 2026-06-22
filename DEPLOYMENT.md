# PromptShield Enterprise Deployment Guide

## Overview

This guide covers enterprise-grade deployment of PromptShield for production LLM applications.

## Deployment Models

### 1. Embedded (Local Integration)
**Best for**: Low-latency requirements, offline operation

```python
from promptshield import PromptDetector

detector = PromptDetector()

def preprocess_input(user_input):
    result = detector.analyze(user_input)
    if result.is_safe:
        return user_input
    else:
        # Log and handle injection attempt
        logger.warning(f"Injection detected: {result.risk_score}")
        raise SecurityError("Invalid input")
```

### 2. API Gateway
**Best for**: Centralized control, monitoring, multiple applications

```bash
# Deploy as reverse proxy
docker run -d \
  -p 8080:8080 \
  -v /path/to/rules:/app/rules \
  promptshield/gateway:latest
```

**Usage**:
```python
import requests

def check_prompt(prompt):
    response = requests.post(
        'http://promptshield-gateway:8080/analyze',
        json={"prompt": prompt}
    )
    return response.json()
```

### 3. Microservice
**Best for**: High throughput, independent scaling

```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: promptshield-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: promptshield
  template:
    metadata:
      labels:
        app: promptshield
    spec:
      containers:
      - name: promptshield
        image: promptshield/service:latest
        ports:
        - containerPort: 8000
        env:
        - name: CACHE_SIZE
          value: "10000"
        - name: THRESHOLD
          value: "60"
```

## Configuration

### Environment Variables
```bash
# Detection
ENABLE_HEURISTICS=true
ENABLE_ML=true
DETECTION_THRESHOLD=60
CACHE_SIZE=1000

# Performance
MAX_WORKERS=4
BATCH_SIZE=100
TIMEOUT_MS=1000

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/promptshield.log

# Security
RULE_SIGNING_KEY=/path/to/key
MODEL_VERIFICATION=true
```

### Docker Deployment

**Dockerfile**:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY python-sdk /app/sdk
RUN pip install /app/sdk

COPY scripts/start.sh /app/

EXPOSE 8000
CMD ["python", "-m", "promptshield.server"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  promptshield:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DETECTION_THRESHOLD=60
      - ENABLE_ML=true
    volumes:
      - ./rules:/app/rules
      - ./logs:/app/logs
```

## Monitoring and Logging

### Metrics to Track
- Detection rate
- False positive rate
- Processing latency (p50, p95, p99)
- Cache hit rate
- QPS (queries per second)

### ELK Stack Integration
```python
from elasticsearch import Elasticsearch

es = Elasticsearch(['localhost:9200'])

def log_detection(result):
    es.index(
        index='promptshield-detections',
        body={
            'timestamp': datetime.now(),
            'risk_score': result.risk_score,
            'detected_patterns': result.detected_patterns,
            'processing_time': result.processing_time_ms
        }
    )
```

### Prometheus Metrics
```python
from prometheus_client import Counter, Histogram

detection_counter = Counter(
    'promptshield_detections_total',
    'Total detections',
    ['attack_type']
)

processing_time = Histogram(
    'promptshield_processing_seconds',
    'Processing time in seconds'
)
```

## Security Considerations

### 1. Model Safety
- Regularly validate models against known bypasses
- Implement model signing and verification
- Use version control for model updates

### 2. Rule Integrity
- Sign detection rules cryptographically
- Validate rule checksums on load
- Maintain rule audit trail

### 3. Access Control
- Authenticate API consumers
- Rate limit by client
- Implement API key rotation

### 4. Data Protection
- Encrypt logs at rest
- Use TLS for network communication
- Implement data retention policies

## Performance Tuning

### Caching Strategy
```python
# Configure by use case
detector = PromptDetector(
    cache_size=5000,  # Adjust based on memory
    enable_ml=False,   # Disable for pure heuristics (faster)
)
```

### Batch Processing
```python
prompts = load_batch_from_queue()
results = detector.analyze_batch(prompts)
process_results(results)
```

### Load Balancing
```python
# HAProxy configuration
backend promptshield
    balance roundrobin
    server ps1 127.0.0.1:8001
    server ps2 127.0.0.1:8002
    server ps3 127.0.0.1:8003
```

## High Availability

### Multi-Region Deployment
```terraform
# Terraform configuration
resource "aws_lambda_function" "promptshield" {
  filename      = "promptshield.zip"
  function_name = "promptshield-detector"
  runtime       = "python3.10"
  
  environment {
    variables = {
      DETECTION_THRESHOLD = "60"
    }
  }
}
```

### Failover Strategy
```python
class RedundantDetector:
    def __init__(self, primary, secondary):
        self.primary = primary
        self.secondary = secondary
    
    def analyze(self, prompt):
        try:
            return self.primary.analyze(prompt)
        except:
            return self.secondary.analyze(prompt)
```

## Compliance

### GDPR Compliance
- Implement data retention policies
- Support right to deletion
- Document processing activities

### Audit Logging
```python
audit_log = {
    "timestamp": datetime.now(),
    "user_id": user_id,
    "action": "prompt_analyzed",
    "risk_score": result.risk_score,
    "decision": "accepted" if result.is_safe else "rejected"
}
```

## Troubleshooting

### High False Positive Rate
1. Lower detection threshold
2. Review and update rules
3. Retrain ML model with domain-specific data

### High False Negative Rate
1. Raise detection threshold
2. Enable ML-based detection
3. Update rules with new attack patterns

### Performance Issues
1. Enable caching
2. Reduce batch size
3. Disable ML for higher throughput
4. Use batch processing

## Support and Updates

- Security patches: Apply immediately
- Rule updates: Deploy weekly
- Model updates: Test before production
- Breaking changes: Announced 30 days in advance

## Resources

- [API Documentation](../docs/API.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Security Research](../docs/PROMPT_INJECTIONS.md)
