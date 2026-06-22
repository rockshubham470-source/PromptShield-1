#!/bin/bash
# Web App Quick Start

echo "🚀 PromptShield Web Dashboard Setup"
echo "===================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node $NODE_VERSION found"

cd web-app

echo ""
echo "Installing dependencies..."
npm install > /dev/null 2>&1
echo "✓ Dependencies installed"

echo ""
echo "Available commands:"
echo "  npm run dev       - Start development server (http://localhost:3000)"
echo "  npm run build     - Build for production"
echo "  npm run preview   - Preview production build"
echo "  npm run lint      - Run linter"
echo "  npm run type-check - Check TypeScript types"
echo ""
echo "Quick start:"
echo "  npm run dev"
echo ""
