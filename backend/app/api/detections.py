from urllib import request as urllib_request
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
import json
from app.core.database import get_db
from app.models import Detection, User
from app.schemas import DetectionRequest, DetectionResponse, DetectionEventResponse
from app.core.config import settings
import sys
import os
from app.core.dependencies import get_current_user, get_caller
from app.core.org_middleware import get_current_org
from app.models import User, UsageMetric
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'python-sdk')))

try:
    from promptshield.detector import PromptDetector
    detector = PromptDetector(
        enable_heuristics=True,
        enable_ml=settings.ml_detection_enabled,
        threshold=settings.default_risk_threshold,
        cache_size=settings.cache_size,
    )
    DETECTOR_AVAILABLE = True
except ImportError:
    DETECTOR_AVAILABLE = False

router = APIRouter(prefix="/detections", tags=["detections"], redirect_slashes=False)


@router.post("/analyze", response_model=DetectionResponse)
async def analyze_prompt(
    request: DetectionRequest,
    db: Session = Depends(get_db),
    caller=Depends(get_caller), 
):
    """Analyze a single prompt for injection attacks.
    Auth: Bearer <JWT> OR Bearer ps_<apikey> OR X-API-Key: ps_<apikey>
    """
    current_user, org_id = caller

    if not DETECTOR_AVAILABLE:
        prompt_lower = request.prompt.lower()
        injection_keywords = [
            "ignore", "override", "pretend", "jailbreak", "dan", "disregard",
            "bypass", "system:", "<system>", "forget", "new instructions"
        ]
        keyword_hits = sum(1 for kw in injection_keywords if kw in prompt_lower)
        mock_score = min(25 + keyword_hits * 20, 95)
        mock_level = "safe" if mock_score < 40 else "caution" if mock_score < 70 else "risky" if mock_score < 85 else "critical"
        mock_patterns = ["direct_override"] if keyword_hits > 0 else []

        detection = Detection(
            user_id=current_user.id,
            application_id=request.application_id,
            organization_id=org_id,
            prompt=request.prompt[:500],
            risk_score=mock_score,
            risk_level=mock_level,
            detected_patterns=json.dumps(mock_patterns),
            processing_time_ms=5,
            source="api"
        )
        db.add(detection)
        metric = db.query(UsageMetric).filter(
            UsageMetric.application_id == request.application_id
        ).first()
        if metric:
            metric.total_requests += 1
            if mock_score > 60:
                metric.blocked_requests += 1
        db.commit()
        db.refresh(detection)

        return {
            "id": detection.id,
            "is_safe": mock_score < settings.default_risk_threshold,
            "risk_score": mock_score,
            "risk_level": mock_level,
            "detected_patterns": mock_patterns,
            "processing_time_ms": 5,
            "recommendations": ["Monitor this pattern"] if mock_patterns else []
        }

    result = detector.analyze(request.prompt)

    risk_level = (
        "safe" if result.risk_score < 40 else
        "caution" if result.risk_score < 70 else
        "risky" if result.risk_score < 85 else
        "critical"
    )

    detection = Detection(
        user_id=current_user.id,
        application_id=request.application_id,
        organization_id=org_id,
        prompt=request.prompt[:500],
        risk_score=result.risk_score,
        risk_level=risk_level,
        detected_patterns=json.dumps(result.detected_patterns),
        processing_time_ms=int(result.processing_time_ms),
        source="api"
    )
    db.add(detection)
    metric = db.query(
        UsageMetric
    ).filter(
        UsageMetric.application_id
        == request.application_id
    ).first()

    if metric:
        metric.total_requests += 1

        if result.risk_score > 60:
            metric.blocked_requests += 1
    db.commit()
    db.refresh(detection)

    return {
        "id": detection.id,
        "is_safe": result.risk_score < settings.default_risk_threshold,
        "risk_score": result.risk_score,
        "risk_level": risk_level,
        "detected_patterns": result.detected_patterns,
        "processing_time_ms": int(result.processing_time_ms),
        "recommendations": result.recommendations
    }

@router.post("/analyze-batch")
async def analyze_batch(
    prompts: list,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):
    """Analyze multiple prompts in batch"""

    if not DETECTOR_AVAILABLE:
        return {
            "results": [
                {
                    "index": i,
                    "is_safe": True,
                    "risk_score": 20,
                    "risk_level": "safe",
                    "processing_time_ms": 5
                }
                for i in range(len(prompts))
            ],
            "total_processed": len(prompts)
        }

    results = []
    for idx, prompt in enumerate(prompts):
        result = detector.analyze(prompt)

        risk_level = (
            "safe" if result.risk_score < 40 else
            "caution" if result.risk_score < 70 else
            "risky" if result.risk_score < 85 else
            "critical"
        )

        detection = Detection(
            user_id=current_user.id,
            application_id=request.application_id,
            organization_id=org_id,
            prompt=prompt[:500],
            risk_score=result.risk_score,
            risk_level=risk_level,
            detected_patterns=json.dumps(result.detected_patterns),
            processing_time_ms=int(result.processing_time_ms),
            source="api"
        )
        db.add(detection)

        results.append({
            "index": idx,
            "is_safe": result.risk_score < settings.default_risk_threshold,
            "risk_score": result.risk_score,
            "risk_level": risk_level,
            "processing_time_ms": int(result.processing_time_ms)
        })

    db.commit()

    return {
        "results": results,
        "total_processed": len(prompts)
    }

@router.get("", response_model=list[DetectionEventResponse])
async def list_detections(
    skip: int = 0,
    limit: int = 50,
    risk_level: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):
    """List detection events for current user, scoped to organization"""

    query = db.query(Detection).filter(
        Detection.user_id == current_user.id,
        Detection.organization_id == org_id
    )

    if risk_level:
        query = query.filter(Detection.risk_level == risk_level)

    detections = query.order_by(desc(Detection.created_at)).offset(skip).limit(limit).all()

    return detections

@router.get("/{detection_id}", response_model=DetectionEventResponse)
async def get_detection(
    detection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: str = Depends(get_current_org)
):
    """Get detection details"""

    detection = db.query(Detection).filter(
        Detection.id == detection_id,
        Detection.user_id == current_user.id,
        Detection.organization_id == org_id
    ).first()

    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection not found"
        )

    return detection