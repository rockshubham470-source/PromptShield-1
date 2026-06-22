from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
import json
from app.core.database import get_db
from app.models import Detection, Rule
from app.schemas import StatsResponse, AnalyticsResponse

router = APIRouter(prefix="/stats", tags=["stats"])

def get_current_user_id(token: str = None) -> str:
    """Mock current user"""
    return "demo-user-id"

@router.get("/dashboard", response_model=StatsResponse)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get dashboard statistics"""
    
    total_detections = db.query(func.count(Detection.id)).filter(
        Detection.user_id == user_id
    ).scalar() or 0

    critical_alerts = db.query(func.count(Detection.id)).filter(
        Detection.user_id == user_id,
        Detection.risk_level == "critical"
    ).scalar() or 0
    
    safe_inputs = db.query(func.count(Detection.id)).filter(
        Detection.user_id == user_id,
        Detection.risk_level == "safe"
    ).scalar() or 0
    
    avg_latency = db.query(func.avg(Detection.processing_time_ms)).filter(
        Detection.user_id == user_id
    ).scalar() or 0
    
    return {
        "total_detections": total_detections,
        "critical_alerts": critical_alerts,
        "safe_inputs": safe_inputs,
        "avg_latency_ms": float(avg_latency),
        "detection_accuracy": 88.4,
        "false_positive_rate": 2.4
    }

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    period: str = "7d",
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get analytics data"""

    now = datetime.utcnow()
    if period == "24h":
        start_date = now - timedelta(hours=24)
    elif period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=90)

    detections = db.query(Detection).filter(
        Detection.user_id == user_id,
        Detection.created_at >= start_date
    ).all()

    risk_counts = {}
    for risk_level in ["safe", "caution", "risky", "critical"]:
        count = sum(1 for d in detections if d.risk_level == risk_level)
        risk_counts[risk_level] = count
    
    pattern_counts = {}
    for detection in detections:
        if detection.detected_patterns:
            patterns = json.loads(detection.detected_patterns)
            for pattern in patterns:
                pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1
    
    top_patterns = [
        {"name": name, "count": count, "percentage": round(count / len(detections) * 100, 1)}
        for name, count in sorted(pattern_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ] if detections else []
    
    return {
        "period": period,
        "total_detections": len(detections),
        "by_risk_level": risk_counts,
        "top_patterns": top_patterns,
        "avg_accuracy": 88.4,
        "avg_latency_ms": sum(d.processing_time_ms for d in detections) / len(detections) if detections else 0
    }
