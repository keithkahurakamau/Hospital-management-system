from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
import json
from app.config.database import get_db
from app.models.queue import PatientQueue
from app.models.patient import Patient
from app.routes.websockets import manager # Import the WebSocket manager

router = APIRouter(prefix="/api/queue", tags=["Queue Management"])

class QueueCreate(BaseModel):
    patient_id: int
    department: str
    acuity_level: int = 3

@router.post("")
@router.post("/", include_in_schema=False)
async def add_to_queue(entry: QueueCreate, db: Session = Depends(get_db)):
    # Verify patient exists
    if not db.query(Patient).filter(Patient.patient_id == entry.patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    new_entry = PatientQueue(**entry.model_dump())
    db.add(new_entry)
    db.commit()
    
    # Broadcast to all React clients that the queue has updated
    await manager.broadcast(json.dumps({"event": "queue_updated", "department": entry.department}))
    
    return {"message": "Patient added to queue", "queue_id": new_entry.queue_id}

@router.get("/{department}")
def get_department_queue(department: str, db: Session = Depends(get_db)):
    """Fetches the queue, STRICTLY sorted by emergency priority, then by wait time."""
    queue = db.query(PatientQueue).options(joinedload(PatientQueue.patient))\
              .filter(PatientQueue.department == department, PatientQueue.status == "Waiting")\
              .order_by(PatientQueue.acuity_level.asc(), PatientQueue.entered_at.asc())\
              .all()
    
    return [
        {
            "queue_id": q.queue_id,
            "patient_name": f"{q.patient.first_name} {q.patient.last_name}",
            "acuity_level": q.acuity_level,
            "wait_time_minutes": int((func.now() - q.entered_at) / 60) if q.entered_at else 0
        } for q in queue
    ]