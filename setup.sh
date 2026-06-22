#!/bin/bash
# Quick start script for PromptShield

set -e

echo "🛡️  PromptShield Quick Start"
echo "=============================="
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✓ Python $PYTHON_VERSION found"

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found (optional for JS SDK)"
else
    NODE_VERSION=$(node -v)
    echo "✓ Node $NODE_VERSION found"
fi

echo ""
echo "Installing Python SDK..."
cd python-sdk
pip install -e . > /dev/null 2>&1
echo "✓ Python SDK installed"

echo ""
echo "Testing Python SDK..."
python3 -c "from promptshield import PromptDetector; detector = PromptDetector(); result = detector.analyze('test'); print(f'✓ Detection works: risk_score={result.risk_score}')"

echo ""
echo "Running benchmarks..."
cd ../test-suite
python3 benchmarks.py --output benchmark_results.json > /dev/null 2>&1
echo "✓ Benchmarks complete (see benchmark_results.json)"

echo ""
echo "=============================="
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Read the documentation: docs/API.md"
echo "2. Try the Python SDK: python3 examples/basic.py"
echo "3. Run tests: pytest python-sdk/tests/"
echo "4. Review benchmarks: test-suite/benchmark_results.json"
echo ""
echo "Documentation:"
echo "- API: docs/API.md"
echo "- Architecture: docs/ARCHITECTURE.md"
echo "- Prompt Injections: docs/PROMPT_INJECTIONS.md"
echo ""
