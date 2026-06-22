from fastapi import Request, HTTPException, status
from fastapi.params import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models import OrganizationUser, User

def get_current_org(request: Request, db: Session = Depends(get_db)):
    """
    Extract organization ID from the JWT token and attach it to request.state.
    Also sets user_id and user_role on request.state for convenience.
    """
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Not authenticated")
    token = auth.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token missing user identifier")
    # Find the user's organization (pick the first if multiple)
    org_user = db.query(OrganizationUser).filter(OrganizationUser.user_id == user_id).first()
    if not org_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="User not attached to any organization")
    request.state.organization_id = org_user.organization_id
    request.state.user_id = user_id
    request.state.user_role = org_user.role
    return org_user.organization_id