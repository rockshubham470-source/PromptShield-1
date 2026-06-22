# Makefile for PromptShield

.PHONY: help setup install test lint format clean build deploy

help:
	@echo "PromptShield - Development Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup       - Complete setup (install deps, build, test)"
	@echo "  make install     - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make test        - Run all tests"
	@echo "  make test-py     - Run Python tests"
	@echo "  make test-js     - Run JavaScript tests"
	@echo "  make lint        - Run linters"
	@echo "  make format      - Format code"
	@echo ""
	@echo "Build & Deployment:"
	@echo "  make build       - Build all SDKs"
	@echo "  make build-py    - Build Python SDK"
	@echo "  make build-js    - Build JavaScript SDK"
	@echo ""
	@echo "Analysis & Benchmarks:"
	@echo "  make benchmark   - Run benchmark suite"
	@echo "  make analyze     - Run research analysis"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Remove build artifacts"
	@echo "  make clean-all   - Remove all generated files"

setup: install build test
	@echo "✓ Setup complete!"

install:
	@echo "Installing Python SDK..."
	cd python-sdk && pip install -e ".[dev]"
	@echo "Installing JavaScript SDK..."
	cd js-sdk && npm install

build: build-py build-js

build-py:
	@echo "Building Python SDK..."
	cd python-sdk && python setup.py sdist bdist_wheel

build-js:
	@echo "Building JavaScript SDK..."
	cd js-sdk && npm run build

test: test-py test-js

test-py:
	@echo "Running Python tests..."
	cd python-sdk && pytest tests/ -v --cov=promptshield --cov-report=html

test-js:
	@echo "Running JavaScript tests..."
	cd js-sdk && npm test

lint:
	@echo "Linting Python..."
	cd python-sdk && flake8 promptshield tests/
	@echo "Linting JavaScript..."
	cd js-sdk && npm run lint

format:
	@echo "Formatting Python..."
	cd python-sdk && black promptshield tests/
	@echo "Formatting JavaScript..."
	cd js-sdk && npx prettier --write "src/**/*.ts" "tests/**/*.ts"

benchmark:
	@echo "Running benchmark suite..."
	cd test-suite && python benchmarks.py

analyze:
	@echo "Running research analysis..."
	cd research && python analysis.py

clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf python-sdk/build python-sdk/dist python-sdk/*.egg-info
	rm -rf js-sdk/dist js-sdk/*.tgz

clean-all: clean
	@echo "Cleaning all generated files..."
	rm -rf python-sdk/.pytest_cache python-sdk/.coverage
	rm -rf js-sdk/node_modules js-sdk/.nyc_output
	rm -f test-suite/benchmark_results.json
	rm -f research/analysis_results.json

.DEFAULT_GOAL := help
