import importlib
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def test_production_uses_sqlite_fallback_for_serverless(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@db.example.com:5432/app")

    import app.core.config as config_module
    importlib.reload(config_module)

    import app.core.database as database_module
    importlib.reload(database_module)

    assert database_module.DATABASE_URL.startswith("sqlite")
