from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
import enum

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

class AlertCreate(BaseModel):
    camera_id: UUID
    type: AlertType
    severity: AlertSeverity
    title: str
    description: Optional[str] = None
    metadata_: Optional[Dict[str, Any]] = None

class AlertUpdate(BaseModel):
    severity: Optional[AlertSeverity] = None
    title: Optional[str] = None
    description: Optional[str] = None
    metadata_: Optional[Dict[str, Any]] = None

class AlertAcknowledge(BaseModel):
    is_acknowledged: bool = True

class AlertResponse(BaseModel):
    id: UUID
    camera_id: UUID
    user_id: Optional[UUID] = None
    type: AlertType
    severity: AlertSeverity
    title: str
    description: Optional[str] = None
    is_acknowledged: bool
    acknowledged_by: Optional[UUID] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime
    metadata_: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
