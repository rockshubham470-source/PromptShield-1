from fastapi import Request, HTTPException, status
from fastapi.params import Depends

def require_role(*allowed_roles):
    """
    Dependency that ensures the user belongs to one of the allowed roles.
    Usage: dependencies=[Depends(require_role('admin', 'owner'))]
    """
    def role_checker(request: Request):
        user_role = getattr(request.state, "user_role", None)
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions – required one of {allowed_roles}"
            )
        return True
    return Depends(role_checker)