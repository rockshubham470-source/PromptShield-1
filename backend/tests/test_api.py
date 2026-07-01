"""Tests for authentication endpoints"""
import uuid

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "docs" in data


def test_refresh_token_endpoint_returns_new_access_token():
    """Refresh token should produce a new access token for the same user."""
    email = f"refresh-{uuid.uuid4().hex[:8]}@example.com"
    signup_response = client.post(
        "/api/auth/signup",
        json={"email": email, "name": "Refresh User", "password": "Test123!"},
    )

    assert signup_response.status_code == 200
    signup_data = signup_response.json()
    refresh_token = signup_data["refresh_token"]

    refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert refresh_response.status_code == 200
    refresh_data = refresh_response.json()
    assert refresh_data["access_token"]
    assert refresh_data["access_token"] != signup_data["access_token"]
