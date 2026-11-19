from fastapi import APIRouter

from app.api.v1 import auth, cameras, detections, signals, analytics, alerts, health, inference, stream

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(cameras.router, prefix="/cameras", tags=["cameras"])
api_router.include_router(detections.router, prefix="/detections", tags=["detections"])
api_router.include_router(signals.router, prefix="/signals", tags=["signals"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(inference.router, prefix="/inference", tags=["inference"])
api_router.include_router(stream.router, prefix="/stream", tags=["stream"])
