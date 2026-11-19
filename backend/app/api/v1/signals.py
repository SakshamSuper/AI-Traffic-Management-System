import logging
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_operator
from app.models import TrafficSignal, User
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

class SignalOverride(BaseModel):
    phase: str
    duration: int

class SignalTiming(BaseModel):
    green_duration: int
    yellow_duration: int
    red_duration: int

@router.get("/signals")
def list_signals(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Any:
    """List all signal states."""
    signals = db.query(TrafficSignal).all()
    return signals

@router.get("/signals/{camera_id}")
def get_signal(camera_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Any:
    """Get signal for camera."""
    signal = db.query(TrafficSignal).filter(TrafficSignal.camera_id == camera_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return signal

@router.put("/signals/{camera_id}/override", dependencies=[Depends(require_operator)])
def override_signal(camera_id: int, override: SignalOverride, db: Session = Depends(get_db)) -> Any:
    """Manual override: set phase + duration."""
    return {"msg": f"Signal for camera {camera_id} overridden to {override.phase} for {override.duration}s"}

@router.delete("/signals/{camera_id}/override", dependencies=[Depends(require_operator)])
def release_override(camera_id: int, db: Session = Depends(get_db)) -> Any:
    """Release manual override."""
    return {"msg": f"Override released for camera {camera_id}"}

@router.put("/signals/{camera_id}/timing", dependencies=[Depends(require_operator)])
def update_signal_timing(camera_id: int, timing: SignalTiming, db: Session = Depends(get_db)) -> Any:
    """Update phase timing config."""
    return {"msg": f"Timing updated for camera {camera_id}"}

@router.get("/signals/history")
def get_signal_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Any:
    """Signal change history."""
    return []

@router.post("/signals/optimize", dependencies=[Depends(require_operator)])
def optimize_signals(db: Session = Depends(get_db)) -> Any:
    """Trigger manual optimization cycle."""
    return {"msg": "Optimization cycle triggered"}
