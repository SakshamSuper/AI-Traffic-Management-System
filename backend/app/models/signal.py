import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class SignalPhase(str, enum.Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"
    EMERGENCY = "emergency"

class TrafficSignal(Base):
    __tablename__ = "traffic_signals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    camera_id = Column(UUID(as_uuid=True), ForeignKey("cameras.id", ondelete="CASCADE"), unique=True, nullable=False)
    intersection_name = Column(String, nullable=False)
    
    current_phase = Column(Enum(SignalPhase), default=SignalPhase.RED)
    phase_duration = Column(Integer, default=0)  # seconds
    
    green_duration = Column(Integer, default=30)
    yellow_duration = Column(Integer, default=5)
    red_duration = Column(Integer, default=30)
    
    next_phase_at = Column(DateTime(timezone=True), nullable=True)
    
    is_manual_override = Column(Boolean, default=False)
    override_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    emergency_preemption = Column(Boolean, default=False)
    cycle_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    camera = relationship("Camera", back_populates="signal")
    overrider = relationship("User", back_populates="signal_overrides")
