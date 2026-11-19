"""
AI Smart Traffic Management System - FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from loguru import logger
import os

from app.core.config import settings
from app.core.database import init_db
from app.core.redis_client import redis_client
from app.core.logging import setup_logging

# --- Lifespan -------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle manager."""
    setup_logging()
    logger.info(f"🚦 Starting {settings.APP_NAME} v{settings.VERSION}")

    # Initialize database
    logger.info("📦 Initializing database tables...")
    await init_db()

    # Connect to Redis
    logger.info("🔌 Connecting to Redis...")
    await redis_client.connect()

    # Start camera manager & AI processors
    try:
        from app.services.camera_manager import camera_manager
        await camera_manager.start()
        logger.info("📷 Camera manager started")
    except Exception as e:
        logger.warning(f"Camera manager start failed (non-fatal): {e}")

    # Start adaptive signal controller
    try:
        from app.services.signal_controller import signal_controller
        await signal_controller.start()
        logger.info("🚦 Signal controller started")
    except Exception as e:
        logger.warning(f"Signal controller start failed (non-fatal): {e}")

    # Start stream publisher (Redis → WebSocket)
    try:
        from app.workers.stream_publisher import stream_publisher
        await stream_publisher.start()
        logger.info("📡 Stream publisher started")
    except Exception as e:
        logger.warning(f"Stream publisher start failed (non-fatal): {e}")

    # Seed demo data in development
    if settings.ENVIRONMENT in ("development", "demo"):
        try:
            from app.services.demo_data import seed_demo_data
            from app.core.database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                await seed_demo_data(db)
            logger.info("🌱 Demo data seeded")
        except Exception as e:
            logger.warning(f"Demo data seeding failed (non-fatal): {e}")

    logger.info("✅ Application startup complete — ready to serve requests")
    yield

    # ---------- Shutdown ----------
    logger.info("🔴 Shutting down application...")

    try:
        from app.workers.stream_publisher import stream_publisher
        await stream_publisher.stop()
    except Exception:
        pass

    try:
        from app.services.signal_controller import signal_controller
        await signal_controller.stop()
    except Exception:
        pass

    try:
        from app.services.camera_manager import camera_manager
        await camera_manager.stop()
    except Exception:
        pass

    await redis_client.disconnect()
    logger.info("👋 Application shutdown complete")


# --- OpenAPI Metadata -----------------------------------------------------------

tags_metadata = [
    {"name": "auth",       "description": "Authentication, authorization, and user management"},
    {"name": "cameras",    "description": "Camera CRUD, stream control, and zone configuration"},
    {"name": "detections", "description": "Real-time AI detection results and history"},
    {"name": "signals",    "description": "Traffic signal control, optimization, and override"},
    {"name": "analytics",  "description": "Aggregated traffic analytics and report generation"},
    {"name": "alerts",     "description": "System alerts — emergency, congestion, incidents"},
    {"name": "health",     "description": "Service health checks and system metrics"},
]

# --- FastAPI App ----------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=(
        "## AI Smart Traffic Management System\n\n"
        "Production-grade real-time traffic analysis platform powered by **YOLOv11**, **ByteTrack**, "
        "and **OpenCV**. Supports RTSP/IP camera feeds, adaptive signal control, emergency vehicle "
        "preemption, congestion analytics, and WebSocket live streaming.\n\n"
        "### Default Credentials\n"
        "- **Admin**: `admin` / `admin123`\n"
        "- **Operator**: `operator` / `operator123`\n"
        "- **Viewer**: `viewer` / `viewer123`"
    ),
    contact={
        "name": "TrafficAI Support",
        "email": "support@traffic-ai.com",
        "url": "https://github.com/traffic-ai/management-system",
    },
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
    openapi_tags=tags_metadata,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# --- Middlewares ----------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# --- Static Files ---------------------------------------------------------------

os.makedirs("media", exist_ok=True)
os.makedirs("media/snapshots", exist_ok=True)
os.makedirs("media/reports", exist_ok=True)
os.makedirs("models", exist_ok=True)

app.mount("/media", StaticFiles(directory="media"), name="media")

# --- Exception Handlers ---------------------------------------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} — {request.method} {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation Error", "errors": [str(e) for e in exc.errors()]},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {type(exc).__name__} - {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected internal error occurred. Please contact support."},
    )

# --- Routers -------------------------------------------------------------------

from app.api.v1.router import api_router
from app.api.websockets import router as ws_router

app.include_router(api_router, prefix="/api/v1")
app.include_router(ws_router)

# --- Root Health ---------------------------------------------------------------

@app.get("/health", tags=["health"], summary="Quick health check")
async def root_health():
    """Lightweight liveness check — returns 200 if the application process is running."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "app": settings.APP_NAME,
    }

@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/api/docs",
        "redoc": "/api/redoc",
        "health": "/health",
    }
