"""PromptShield - Prompt Injection Detection Library"""

from .detector import PromptDetector, AnalysisResult
from .exceptions import DetectionError, ModelError

__version__ = "1.0.0"
__author__ = "PromptShield Team"
__all__ = [
    "PromptDetector",
    "AnalysisResult",
    "DetectionError",
    "ModelError",
]
