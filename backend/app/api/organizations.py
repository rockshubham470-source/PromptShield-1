from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.org_middleware import get_current_org
from app.models import Organization

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.get("/me")
def get_current_organization(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {
        "id": org.id,
        "name": org.name,
        "settings_json": org.settings_json
    }