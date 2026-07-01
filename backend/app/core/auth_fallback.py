import json
import os
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

_STATE_LOCK = threading.Lock()
_STATE: Optional[Dict[str, Any]] = None
_STATE_PATH = os.getenv("AUTH_FALLBACK_STATE_PATH", "/tmp/promptshield_auth_state.json")


class FallbackUser:
    def __init__(self, **kwargs: Any) -> None:
        self.id = kwargs.get("id")
        self.email = kwargs.get("email")
        self.name = kwargs.get("name")
        self.password_hash = kwargs.get("password_hash")
        self.tier = kwargs.get("tier", "free")
        self.is_active = kwargs.get("is_active", True)
        self.is_verified = kwargs.get("is_verified", False)
        self.failed_login_attempts = kwargs.get("failed_login_attempts", 0)
        self.locked_until = kwargs.get("locked_until")
        self.created_at = kwargs.get("created_at") or datetime.utcnow()
        self.updated_at = kwargs.get("updated_at") or datetime.utcnow()
        self.organization_id = kwargs.get("organization_id")
        self.organization_name = kwargs.get("organization_name")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "tier": self.tier,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "failed_login_attempts": self.failed_login_attempts,
            "locked_until": self.locked_until,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "organization_id": self.organization_id,
            "organization_name": self.organization_name,
        }


def _load_state() -> Dict[str, Any]:
    global _STATE
    if _STATE is not None:
        return _STATE
    if os.path.exists(_STATE_PATH):
        try:
            with open(_STATE_PATH, "r", encoding="utf-8") as handle:
                _STATE = json.load(handle)
        except Exception:
            _STATE = {"users": {}, "organizations": {}, "org_users": {}}
    else:
        _STATE = {"users": {}, "organizations": {}, "org_users": {}}
    return _STATE


def _persist_state() -> None:
    global _STATE
    state = _STATE or {"users": {}, "organizations": {}, "org_users": {}}
    os.makedirs(os.path.dirname(_STATE_PATH), exist_ok=True)
    with open(_STATE_PATH, "w", encoding="utf-8") as handle:
        json.dump(state, handle, default=str)


def _serialize_user(user: FallbackUser) -> Dict[str, Any]:
    return user.to_dict()


def get_fallback_user_by_email(email: str) -> Optional[FallbackUser]:
    state = _load_state()
    raw_user = state["users"].get(email)
    if not raw_user:
        return None
    return FallbackUser(**raw_user)


def get_fallback_user_by_id(user_id: str) -> Optional[FallbackUser]:
    state = _load_state()
    for raw_user in state["users"].values():
        if raw_user.get("id") == user_id:
            return FallbackUser(**raw_user)
    return None


def create_fallback_user(email: str, name: str, password_hash: str) -> FallbackUser:
    state = _load_state()
    user_id = str(uuid.uuid4())
    user = FallbackUser(
        id=user_id,
        email=email,
        name=name,
        password_hash=password_hash,
        tier="free",
        is_active=True,
        is_verified=False,
        failed_login_attempts=0,
        locked_until=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    state["users"][email] = _serialize_user(user)
    _persist_state()
    return user


def create_fallback_organization(user_id: str, name: str) -> Dict[str, Any]:
    state = _load_state()
    org_id = str(uuid.uuid4())
    organization = {
        "id": org_id,
        "name": name,
        "created_at": datetime.utcnow().isoformat(),
    }
    state["organizations"][org_id] = organization
    state["org_users"][user_id] = {
        "organization_id": org_id,
        "role": "owner",
    }
    _persist_state()
    return organization


def get_fallback_org_for_user(user_id: str) -> Optional[Dict[str, Any]]:
    state = _load_state()
    org_link = state["org_users"].get(user_id)
    if not org_link:
        return None
    organization = state["organizations"].get(org_link.get("organization_id"))
    if not organization:
        return None
    return organization


def update_fallback_user(user: FallbackUser) -> None:
    state = _load_state()
    state["users"][user.email] = _serialize_user(user)
    _persist_state()
