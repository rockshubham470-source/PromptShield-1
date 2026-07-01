import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.auth_fallback import create_fallback_user, get_fallback_user_by_email


def test_create_fallback_user_and_lookup_by_email():
    email = "fallback@example.com"
    user = create_fallback_user(email=email, name="Fallback User", password_hash="hash")

    fetched = get_fallback_user_by_email(email)

    assert fetched is not None
    assert fetched.email == email
    assert fetched.id == user.id
