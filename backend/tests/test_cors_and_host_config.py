from importlib import reload
import sys
from pathlib import Path

import pytest
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def test_frontend_host_is_allowed_for_cors_and_trusted_hosts(monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "frontend_url", "https://promptshield-web-coral.vercel.app")
    monkeypatch.setattr(config_module.settings, "allowed_origins", [])
    monkeypatch.setattr(config_module.settings, "trusted_hosts", ["localhost", "127.0.0.1"])

    import app.main as main_module
    reload(main_module)

    cors_middleware = next(
        middleware for middleware in main_module.app.user_middleware
        if middleware.cls is CORSMiddleware
    )
    trusted_host_middleware = next(
        middleware for middleware in main_module.app.user_middleware
        if middleware.cls is TrustedHostMiddleware
    )

    assert "https://promptshield-web-coral.vercel.app" in cors_middleware.options["allow_origins"]
    assert "promptshield-web-coral.vercel.app" in trusted_host_middleware.options["allowed_hosts"]
