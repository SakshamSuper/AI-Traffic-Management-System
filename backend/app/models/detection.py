import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Detection(Base):
    __tablename__ = "detections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    camera_id = Column(UUID(as_uuid=True), ForeignKey("cameras.id", ondelete="CASCADE"), index=True, nullable=False)
    
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    frame_number = Column(Integer, nullable=False)
    
    vehicle_count = Column(JSON, nullable=False)  # {car: 5, bus: 2, ...}
    pedestrian_count = Column(Integer, default=0)
    
    queue_length = Column(Float, default=0.0)
    density = Column(Float, default=0.0)  # 0 to 1
    occupancy = Column(Float, default=0.0)  # 0 to 1
    avg_speed = Column(Float, nullable=True)  # km/h
    
    congestion_score = Column(Float, default=0.0)  # 0 to 100
    
    emergency_detected = Column(Boolean, default=False)
    emergency_type = Column(String, nullable=True)
    
    raw_detections = Column(JSON, nullable=True)  # List of bboxes, track_ids, etc.
    
    camera = relationship("Camera", back_populates="detections")
