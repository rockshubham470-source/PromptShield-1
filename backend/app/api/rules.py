from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Rule
from app.schemas import RuleResponse

router = APIRouter(prefix="/rules", tags=["rules"])

def get_current_user_id(token: str = None) -> str:
    """Mock current user"""
    return "demo-user-id"

@router.get("/", response_model=list[RuleResponse])
async def list_rules(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """List all detection rules"""
    
    rules = db.query(Rule).all()
    return rules

@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get rule details"""
    
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    return rule
