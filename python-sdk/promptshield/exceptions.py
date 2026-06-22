"""Exception classes for PromptShield"""


class DetectionError(Exception):
    """Raised when detection analysis fails"""
    pass


class ModelError(Exception):
    """Raised when model loading or inference fails"""
    pass


class RuleError(Exception):
    """Raised when rule loading or validation fails"""
    pass
