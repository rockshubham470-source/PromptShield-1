import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def test_detector_uses_rule_only_mode_when_ml_disabled(monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "ml_detection_enabled", False)
    monkeypatch.setattr(config_module.settings, "default_risk_threshold", 60)
    monkeypatch.setattr(config_module.settings, "cache_size", 100)

    module = importlib.import_module("app.api.detections")
    module = importlib.reload(module)

    assert module.detector.enable_ml is False
    assert module.detector.threshold == 60
