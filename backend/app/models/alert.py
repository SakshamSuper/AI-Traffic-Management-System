import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class AlertType(str, enum.Enum):
    EMERGENCY_VEHICLE = "emergency_vehicle"
    CONGESTION = "congestion"
    ACCIDENT = "accident"
    DEBRIS = "debris"
    WRONG_WAY = "wrong_way"
    ANIMAL = "animal"
    MANUAL = "manual"

class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    camera_id = Column(UUID(as_uuid=True), ForeignKey("cameras.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM)
    
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    metadata_ = Column("metadata", JSON, nullable=True)  # renamed to avoid conflict with SQLAlchemy Base.metadata
    
    camera = relationship("Camera", back_populates="alerts")
    user = relationship("User", foreign_keys=[user_id], back_populates="alerts")
    acknowledger = relationship("User", foreign_keys=[acknowledged_by], back_populates="acknowledged_alerts")
