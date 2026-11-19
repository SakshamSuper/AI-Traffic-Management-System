import logging
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user, require_admin, require_operator
from app.models import Alert, User

logger = logging.getLogger(__name__)

router = APIRouter()

class AlertCreate(BaseModel):
    camera_id: int
    type: str
    severity: str
    description: str

class AlertAcknowledge(BaseModel):
    alert_ids: List[int]
    notes: Optional[str] = None

@router.get("")
def list_alerts(
    type: Optional[str] = None,
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    camera_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Any:
    """List alerts with filters."""
    query = db.query(Alert)
    if type:
        query = query.filter(Alert.type == type)
    if severity:
        query = query.filter(Alert.severity == severity)
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)
    if camera_id:
        query = query.filter(Alert.camera_id == camera_id)
        
    alerts = query.order_by(Alert.timestamp.desc()).offset(skip).limit(limit).all()
    return alerts

@router.get("/stats")
def get_alert_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Any:
    """Alert counts by type and severity."""
    return {"critical": 2, "warning": 5, "info": 12}

@router.get("/{id}")
def get_alert(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Any:
    """Get alert details."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("", dependencies=[Depends(require_operator)])
def create_alert(alert_in: AlertCreate, db: Session = Depends(get_db)) -> Any:
    """Create manual alert (operator+)."""
    new_alert = Alert(**alert_in.dict(), timestamp=datetime.utcnow(), acknowledged=False)
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

@router.put("/{id}/acknowledge", dependencies=[Depends(require_operator)])
def acknowledge_alert(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Any:
    """Acknowledge alert."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    alert.acknowledged_by = user.id
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert

@router.delete("/{id}", dependencies=[Depends(require_admin)])
def delete_alert(id: int, db: Session = Depends(get_db)) -> Any:
    """Delete alert (admin)."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"msg": "Alert deleted"}

@router.post("/bulk-acknowledge", dependencies=[Depends(require_operator)])
def bulk_acknowledge_alerts(data: AlertAcknowledge, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Any:
    """Acknowledge multiple alerts."""
    alerts = db.query(Alert).filter(Alert.id.in_(data.alert_ids)).all()
    for alert in alerts:
        alert.acknowledged = True
        alert.acknowledged_by = user.id
        alert.acknowledged_at = datetime.utcnow()
    db.commit()
    return {"msg": f"Acknowledged {len(alerts)} alerts"}
