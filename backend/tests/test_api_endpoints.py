import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

def test_health_check(client):
    """Test public health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "app" in data

def test_root_welcome(client):
    """Test root endpoint redirect/welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["docs"] == "/api/docs"
    assert data["health"] == "/health"

def test_settings_attributes():
    """Verify application configuration defaults."""
    assert settings.APP_NAME == "AI Smart Traffic Management System" or "Traffic" in settings.APP_NAME
    assert settings.VERSION is not None
    assert isinstance(settings.MAX_CAMERAS, int)
    assert settings.MAX_CAMERAS > 0
    assert isinstance(settings.CORS_ORIGINS, list)
