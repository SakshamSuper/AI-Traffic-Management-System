import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class CameraStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"
    CONNECTING = "connecting"

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True, nullable=False)
    location = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    rtsp_url = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    port = Column(Integer, nullable=True)
    
    status = Column(Enum(CameraStatus), default=CameraStatus.OFFLINE)
    is_active = Column(Boolean, default=True)
    
    resolution_width = Column(Integer, default=1920)
    resolution_height = Column(Integer, default=1080)
    fps = Column(Integer, default=30)
    
    zone_config = Column(JSON, nullable=True)  # Lane/zone configurations
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    detections = relationship("Detection", back_populates="camera", cascade="all, delete-orphan")
    signal = relationship("TrafficSignal", back_populates="camera", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="camera", cascade="all, delete-orphan")
