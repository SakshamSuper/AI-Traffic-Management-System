from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from uuid import UUID

class DetectionRecord(BaseModel):
    bbox: List[float] # [x1, y1, x2, y2]
    class_id: int
    class_name: str
    confidence: float
    track_id: Optional[int] = None

class VehicleCounts(BaseModel):
    car: int = 0
    bus: int = 0
    truck: int = 0
    motorcycle: int = 0
    bicycle: int = 0

class DetectionFrame(BaseModel):
    id: UUID
    camera_id: UUID
    timestamp: datetime
    frame_number: int
    vehicle_count: Dict[str, int]
    pedestrian_count: int
    queue_length: float
    density: float = Field(..., ge=0.0, le=1.0)
    occupancy: float = Field(..., ge=0.0, le=1.0)
    avg_speed: Optional[float] = None
    congestion_score: float = Field(..., ge=0.0, le=100.0)
    emergency_detected: bool
    emergency_type: Optional[str] = None
    raw_detections: Optional[List[DetectionRecord]] = None

    class Config:
        from_attributes = True

class DetectionHistoryQuery(BaseModel):
    camera_id: UUID
    start_time: datetime
    end_time: datetime
    limit: int = 100
    offset: int = 0

class DetectionHistoryResponse(BaseModel):
    total: int
    items: List[DetectionFrame]
