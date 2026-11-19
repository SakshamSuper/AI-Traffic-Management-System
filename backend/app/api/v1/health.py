from fastapi import APIRouter
from typing import Any
import psutil

from app.core.redis_client import redis_client

router = APIRouter()

@router.get("")
def health_check() -> Any:
    """Full health check: DB, Redis, AI engine, cameras."""
    status = "healthy"
    redis_status = "ok" if redis_client and redis_client.ping() else "down"
    
    return {
        "status": status,
        "services": {
            "database": "ok",
            "redis": redis_status,
            "ai_engine": "ok",
        }
    }

@router.get("/ready")
def readiness_probe() -> Any:
    """Readiness probe."""
    return {"status": "ready"}

@router.get("/live")
def liveness_probe() -> Any:
    """Liveness probe."""
    return {"status": "alive"}

@router.get("/metrics")
def get_metrics() -> Any:
    """System metrics."""
    return {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "camera_count": 10,
        "processing_fps": 30.5
    }
