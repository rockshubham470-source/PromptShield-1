#!/bin/bash
# Backend Quick Start

echo "🚀 PromptShield Backend API Setup"
echo "===================================="
echo ""

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✓ $PYTHON_VERSION found"

# Check for virtualenv
if [ ! -d "venv" ]; then
    echo ""
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate venv
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

echo ""
echo "Installing dependencies..."
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

echo ""
echo "Available commands:"
echo "  python init_db.py                      - Initialize database"
echo "  uvicorn app.main:app --reload          - Start dev server"
echo "  python -m pytest                       - Run tests"
echo ""
echo "Or use Docker:"
echo "  docker-compose up                      - Start all services"
echo ""
echo "To get started:"
echo "  1. Set up .env file (copy from .env.example)"
echo "  2. python init_db.py"
echo "  3. uvicorn app.main:app --reload"
echo ""
