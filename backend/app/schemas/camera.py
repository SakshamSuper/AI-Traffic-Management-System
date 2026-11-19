from pydantic import BaseModel, Field, IPvAnyAddress
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
import enum

class CameraStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"
    CONNECTING = "connecting"

class CameraCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location: str
    description: Optional[str] = None
    rtsp_url: str
    ip_address: Optional[str] = None
    port: Optional[int] = None
    resolution_width: int = 1920
    resolution_height: int = 1080
    fps: int = 30
    zone_config: Optional[Dict[str, Any]] = None

class CameraUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = None
    description: Optional[str] = None
    rtsp_url: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    is_active: Optional[bool] = None
    resolution_width: Optional[int] = None
    resolution_height: Optional[int] = None
    fps: Optional[int] = None
    zone_config: Optional[Dict[str, Any]] = None

class CameraResponse(BaseModel):
    id: UUID
    name: str
    location: str
    description: Optional[str] = None
    rtsp_url: str
    ip_address: Optional[str] = None
    port: Optional[int] = None
    status: CameraStatus
    is_active: bool
    resolution_width: int
    resolution_height: int
    fps: int
    zone_config: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CameraStreamConfig(BaseModel):
    camera_id: UUID
    quality: str = "medium"
    enabled: bool = True
