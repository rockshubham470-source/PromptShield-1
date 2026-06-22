from sqlalchemy.orm import Session
from app.models import AuditLog
from datetime import datetime

def create_audit_log(
    db: Session,
    user_id: str,
    action: str,
    resource: str = None,
    details: str = None,
    ip_address: str = None,
    user_agent: str = None,
    application_id: str = None,
    organization_id: str = None
):
    """
    Create an audit log entry
    """
    audit_log = AuditLog(
        user_id=user_id,
        application_id=application_id,
        organization_id=organization_id,
        action=action,
        resource=resource,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=datetime.utcnow()
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log