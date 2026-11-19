import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "AI Smart Traffic Management System"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "supersecretkey_please_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/traffic"
    REDIS_URL: str = "redis://localhost:6379/0"
    CORS_ORIGINS: List[str] = ["*"]
    
    AI_MODEL_PATH: str = "yolov8n.pt"
    AI_CONFIDENCE_THRESHOLD: float = 0.5
    AI_NMS_THRESHOLD: float = 0.45
    
    MAX_CAMERAS: int = 20
    FRAME_RATE: int = 10
    STREAM_QUALITY: str = "medium"
    
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"
    
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
