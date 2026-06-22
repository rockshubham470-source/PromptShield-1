"""Makefile for backend development"""

.PHONY: help install dev test lint format clean setup docker-up docker-down

help:
	@echo "PromptShield Backend Commands"
	@echo "============================="
	@echo "make setup       - Setup development environment"
	@echo "make install    - Install dependencies"
	@echo "make dev        - Start development server"
	@echo "make test       - Run tests"
	@echo "make lint       - Run linter"
	@echo "make format     - Format code"
	@echo "make clean      - Clean cache files"
	@echo "make db-init    - Initialize database"
	@echo "make docker-up  - Start Docker services"
	@echo "make docker-down - Stop Docker services"

setup:
	python3 -m venv venv
	. venv/bin/activate && pip install -r requirements.txt
	cp .env.example .env
	python init_db.py
	@echo "✓ Setup complete"

install:
	pip install -r requirements.txt

dev:
	python run.py

test:
	pytest -v

test-cov:
	pytest --cov=app tests/

lint:
	flake8 app tests

format:
	black app tests

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov

db-init:
	python init_db.py

docker-up:
	docker-compose up -d
	@echo "✓ Services started (PostgreSQL, Redis, API)"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f backend
