"""README for Python SDK"""

# PromptShield Python SDK

Fast, production-ready prompt injection detection for Python applications.

## Installation

```bash
pip install promptshield
```

## Quick Start

```python
from promptshield import PromptDetector

# Initialize detector
detector = PromptDetector()

# Analyze a prompt
result = detector.analyze("User input here")

print(f"Safe: {result.is_safe}")
print(f"Risk Score: {result.risk_score}")
print(f"Recommendations: {result.recommendations}")
```

## Features

- ⚡ Fast heuristic detection (< 1ms)
- 🤖 ML-based semantic analysis
- 🎯 88.4% detection rate, 2.4% false positive rate
- 🔧 Easy integration
- 📊 Detailed analysis reports
- 💾 Built-in caching
- 🚀 Batch processing support

## API

See [API.md](../../docs/API.md) for complete documentation.

## Testing

```bash
pip install -e ".[dev]"
pytest tests/
```

## License

MIT
