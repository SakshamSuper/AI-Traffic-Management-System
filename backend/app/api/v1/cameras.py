import logging
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user, require_admin, require_operator
from app.models import Camera, User
from app.core.redis_client import redis_client

logger = logging.getLogger(__name__)

router = APIRouter()

class CameraCreate(BaseModel):
    name: str
    location: str
    stream_url: str
    is_active: bool = True

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    stream_url: Optional[str] = None
    is_active: Optional[bool] = None

class CameraResponse(BaseModel):
    id: int
    name: str
    location: str
    stream_url: str
    is_active: bool
    status: Optional[str] = "offline"

    class Config:
        orm_mode = True

@router.get("/cameras", response_model=List[CameraResponse])
def list_cameras(skip: int = 0, limit: int = 100, is_active: Optional[bool] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Any:
    """List cameras with pagination and filtering."""
    query = db.query(Camera)
    if is_active is not None:
        query = query.filter(Camera.is_active == is_active)
    
    cameras = query.offset(skip).limit(limit).all()
    # Populate status from redis
    results = []
    for cam in cameras:
        cam_dict = {
            "id": cam.id, "name": cam.name, "location": cam.location,
            "stream_url": cam.stream_url, "is_active": cam.is_active,
            "status": "online" if redis_client and redis_client.get(f"camera_status:{cam.id}") else "offline"
        }
        results.append(cam_dict)
    return results

@router.post("/cameras", response_model=CameraResponse, dependencies=[Depends(require_operator)])
def create_camera(cam_in: CameraCreate, db: Session = Depends(get_db)) -> Any:
    """Create a new camera (admin/operator)."""
    try:
        new_cam = Camera(**cam_in.dict())
        db.add(new_cam)
        db.commit()
        db.refresh(new_cam)
        return {**new_cam.__dict__, "status": "offline"}
    except Exception as e:
        logger.error(f"Error creating camera: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/cameras/{id}", response_model=CameraResponse)
def get_camera(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Any:
    """Get camera details."""
    cam = db.query(Camera).filter(Camera.id == id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    status = "online" if redis_client and redis_client.get(f"camera_status:{id}") else "offline"
    return {**cam.__dict__, "status": status}

@router.put("/cameras/{id}", response_model=CameraResponse, dependencies=[Depends(require_operator)])
def update_camera(id: int, cam_in: CameraUpdate, db: Session = Depends(get_db)) -> Any:
    """Update camera config (admin/operator)."""
    cam = db.query(Camera).filter(Camera.id == id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    update_data = cam_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cam, key, value)
        
    db.commit()
    db.refresh(cam)
    status = "online" if redis_client and redis_client.get(f"camera_status:{id}") else "offline"
    return {**cam.__dict__, "status": status}

@router.delete("/cameras/{id}", dependencies=[Depends(require_admin)])
def delete_camera(id: int, db: Session = Depends(get_db)) -> Any:
    """Soft delete camera (admin)."""
    cam = db.query(Camera).filter(Camera.id == id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    cam.is_active = False
    db.commit()
    return {"msg": f"Camera {id} deleted successfully"}

@router.post("/cameras/{id}/start", dependencies=[Depends(require_operator)])
def start_camera_stream(id: int, db: Session = Depends(get_db)) -> Any:
    """Start processing stream."""
    if redis_client:
        redis_client.set(f"camera_status:{id}", "online")
    return {"msg": f"Stream started for camera {id}"}

@router.post("/cameras/{id}/stop", dependencies=[Depends(require_operator)])
def stop_camera_stream(id: int, db: Session = Depends(get_db)) -> Any:
    """Stop processing stream."""
    if redis_client:
        redis_client.delete(f"camera_status:{id}")
    return {"msg": f"Stream stopped for camera {id}"}

@router.get("/cameras/{id}/snapshot")
def get_camera_snapshot(id: int, user: User = Depends(get_current_user)) -> Any:
    """Get latest frame as JPEG."""
    return {"msg": "Returns a JPEG frame bytes here (stub)"}

@router.get("/cameras/{id}/metrics")
def get_camera_metrics(id: int, user: User = Depends(get_current_user)) -> Any:
    """Current real-time metrics from Redis."""
    metrics = {"fps": 0, "vehicles_detected": 0}
    if redis_client:
        raw_metrics = redis_client.hgetall(f"camera_metrics:{id}")
        if raw_metrics:
            metrics = {k.decode(): float(v.decode()) if v.decode().replace('.','').isdigit() else v.decode() for k, v in raw_metrics.items()}
    return metrics

@router.post("/cameras/{id}/zones", dependencies=[Depends(require_operator)])
def configure_camera_zones(id: int, zones: list, db: Session = Depends(get_db)) -> Any:
    """Configure detection zones/lanes."""
    return {"msg": f"Zones configured for camera {id}", "zones": zones}
