"""
Team management API — invite, list, update roles, and remove members.

Roles (lowest to highest privilege):
  viewer  — read-only dashboard access
  member  — can create/analyze, cannot manage org settings
  admin   — full access except billing and owner transfer
  owner   — full access

Invitation flow:
  1. POST /team/invite         → creates TeamInvitation, returns invite link token
  2. GET  /team/invite/:token  → validates token (public — no auth)
  3. POST /team/invite/:token/accept → accepts invite (creates org membership)
"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.org_middleware import get_current_org
from app.models import User, Organization, OrganizationUser, TeamInvitation, organization_users

router = APIRouter(prefix="/team", tags=["team"])

VALID_ROLES = {"owner", "admin", "member", "viewer"}
INVITE_EXPIRY_HOURS = 72

# ── schemas ──────────────────────────────────────────────────────────────────

class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "member"

class MemberResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    joined_at: Optional[datetime]

class RoleUpdateRequest(BaseModel):
    role: str

class InviteInfoResponse(BaseModel):
    organization_name: str
    email: str
    role: str
    expires_at: datetime

class AcceptInviteRequest(BaseModel):
    name: Optional[str] = None    
    password: Optional[str] = None  


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_caller_role(db: Session, org_id: str, user_id: str) -> Optional[str]:
    row = db.execute(
        organization_users.select().where(
            organization_users.c.organization_id == org_id,
            organization_users.c.user_id == user_id,
        )
    ).first()
    return row.role if row else None


def _require_admin_or_owner(db: Session, org_id: str, user_id: str) -> None:
    role = _get_caller_role(db, org_id, user_id)
    if role not in ("admin", "owner"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Owner role required.",
        )


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.get("/members", response_model=list[MemberResponse])
def list_members(
    org_id: str = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        organization_users.select().where(
            organization_users.c.organization_id == org_id
        )
    ).fetchall()

    result = []
    for row in rows:
        u = db.query(User).filter(User.id == row.user_id).first()
        if u:
            result.append({
                "user_id": u.id,
                "email": u.email,
                "name": u.name,
                "role": row.role,
                "joined_at": None,
            })
    return result


@router.post("/invite", status_code=201)
def invite_member(
    body: InviteRequest,
    org_id: str = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_owner(db, org_id, current_user.id)

    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")

    existing_user = db.query(User).filter(User.email == body.email).first()
    if existing_user:
        existing_membership = db.execute(
            organization_users.select().where(
                organization_users.c.organization_id == org_id,
                organization_users.c.user_id == existing_user.id,
            )
        ).first()
        if existing_membership:
            raise HTTPException(status_code=400, detail="User is already a member of this organization.")

    db.query(TeamInvitation).filter(
        TeamInvitation.organization_id == org_id,
        TeamInvitation.email == body.email,
        TeamInvitation.accepted_at == None,
    ).delete()

    token = secrets.token_urlsafe(32)
    invite = TeamInvitation(
        organization_id=org_id,
        invited_by=current_user.id,
        email=body.email,
        role=body.role,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=INVITE_EXPIRY_HOURS),
    )
    db.add(invite)
    db.commit()

    org = db.query(Organization).filter(Organization.id == org_id).first()

    return {
        "message": f"Invitation sent to {body.email}",
        "invite_token": token,
        "invite_url": f"/invite/{token}",   
        "expires_at": invite.expires_at,
        "organization": org.name if org else org_id,
    }


@router.get("/invite/{token}", response_model=InviteInfoResponse)
def get_invite_info(token: str, db: Session = Depends(get_db)):
    """Public endpoint — validate invite token and return metadata."""
    inv = db.query(TeamInvitation).filter(
        TeamInvitation.token == token,
        TeamInvitation.accepted_at == None,
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found or already used.")
    if inv.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invite has expired.")

    org = db.query(Organization).filter(Organization.id == inv.organization_id).first()
    return {
        "organization_name": org.name if org else "Unknown",
        "email": inv.email,
        "role": inv.role,
        "expires_at": inv.expires_at,
    }


@router.post("/invite/{token}/accept", status_code=200)
def accept_invite(
    token: str,
    body: AcceptInviteRequest,
    db: Session = Depends(get_db),
):
    """Accept an invitation. Creates the user account if it doesn't exist."""
    from app.core.security import hash_password

    inv = db.query(TeamInvitation).filter(
        TeamInvitation.token == token,
        TeamInvitation.accepted_at == None,
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found or already used.")
    if inv.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invite has expired.")

    user = db.query(User).filter(User.email == inv.email).first()
    if not user:
        if not body.name or not body.password:
            raise HTTPException(
                status_code=400,
                detail="New users must provide name and password.",
            )
        user = User(
            email=inv.email,
            name=body.name,
            password_hash=hash_password(body.password),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.flush()

    db.execute(
        organization_users.insert().values(
            organization_id=inv.organization_id,
            user_id=user.id,
            role=inv.role,
        )
    )
    inv.accepted_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Invitation accepted. You may now log in."}


@router.patch("/members/{user_id}/role", status_code=200)
def update_member_role(
    user_id: str,
    body: RoleUpdateRequest,
    org_id: str = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_owner(db, org_id, current_user.id)

    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role.")

    result = db.execute(
        organization_users.update()
        .where(
            organization_users.c.organization_id == org_id,
            organization_users.c.user_id == user_id,
        )
        .values(role=body.role)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Member not found.")
    db.commit()
    return {"message": "Role updated."}


@router.delete("/members/{user_id}", status_code=204)
def remove_member(
    user_id: str,
    org_id: str = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_owner(db, org_id, current_user.id)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself.")

    result = db.execute(
        organization_users.delete().where(
            organization_users.c.organization_id == org_id,
            organization_users.c.user_id == user_id,
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Member not found.")
    db.commit()


# ── List pending invitations ───────────────────────────────────────────────────

class PendingInviteResponse(BaseModel):
    id: str
    email: str
    role: str
    created_at: datetime
    expires_at: datetime
    token: str

    class Config:
        from_attributes = True


@router.get("/invitations", response_model=list[PendingInviteResponse])
def list_invitations(
    org_id: str = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_owner(db, org_id, current_user.id)
    now = datetime.now(timezone.utc)
    invites = (
        db.query(TeamInvitation)
        .filter(
            TeamInvitation.organization_id == org_id,
            TeamInvitation.accepted_at == None,
            TeamInvitation.expires_at > now,
        )
        .order_by(TeamInvitation.expires_at.asc())
        .all()
    )
    return invites


@router.delete("/invite/{invite_id}", status_code=204)
def revoke_invitation(
    invite_id: str,
    org_id: str = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_owner(db, org_id, current_user.id)
    inv = db.query(TeamInvitation).filter(
        TeamInvitation.id == invite_id,
        TeamInvitation.organization_id == org_id,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    db.delete(inv)
    db.commit()
