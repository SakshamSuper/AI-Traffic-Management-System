from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
import enum

class SignalPhase(str, enum.Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"
    EMERGENCY = "emergency"

class SignalStatus(BaseModel):
    id: UUID
    camera_id: UUID
    intersection_name: str
    current_phase: SignalPhase
    phase_duration: int
    green_duration: int
    yellow_duration: int
    red_duration: int
    next_phase_at: Optional[datetime] = None
    is_manual_override: bool
    override_by: Optional[UUID] = None
    emergency_preemption: bool
    cycle_count: int
    updated_at: datetime

    class Config:
        from_attributes = True

class SignalOverride(BaseModel):
    phase: SignalPhase
    duration: int
    is_emergency: bool = False

class SignalUpdate(BaseModel):
    green_duration: Optional[int] = None
    yellow_duration: Optional[int] = None
    red_duration: Optional[int] = None

class SignalOptimizationResult(BaseModel):
    camera_id: UUID
    recommended_green: int
    recommended_red: int
    congestion_level: float
    reasoning: str
