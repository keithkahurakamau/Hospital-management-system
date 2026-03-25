from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
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
    notes: str = None

class QueueUpdate(BaseModel):
    status: str

@router.post("")
@router.post("/", include_in_schema=False)
async def add_to_queue(entry: QueueCreate, db: Session = Depends(get_db)):
    # Verify patient exists
    if not db.query(Patient).filter(Patient.patient_id == entry.patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    # Prevent duplicate active queueing in the same department
    existing = db.query(PatientQueue).filter(
        PatientQueue.patient_id == entry.patient_id,
        PatientQueue.department == entry.department,
        PatientQueue.status != "Completed"
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Patient is already in the {entry.department} queue.")

    new_entry = PatientQueue(**entry.model_dump())
    db.add(new_entry)
    db.commit()
    
    # Broadcast to all React clients that the queue has updated
    await manager.broadcast(json.dumps({"event": "queue_updated", "department": entry.department}))
    
    return {"message": "Patient routed successfully", "queue_id": new_entry.queue_id}

@router.get("/{department}")
def get_department_queue(department: str, db: Session = Depends(get_db)):
    """Fetches the active queue, sorted by emergency priority, then by wait time."""
    queue = db.query(PatientQueue).options(joinedload(PatientQueue.patient))\
              .filter(PatientQueue.department == department, PatientQueue.status != "Completed")\
              .order_by(PatientQueue.acuity_level.asc(), PatientQueue.joined_at.asc())\
              .all()
    
    return [
        {
            "queue_id": q.queue_id,
            "patient_id": q.patient_id,
            "patient_name": f"{q.patient.surname} {q.patient.other_names}",
            "outpatient_no": q.patient.outpatient_no,
            "sex": q.patient.sex,
            "acuity_level": q.acuity_level,
            "status": q.status,
            "notes": q.notes,
            "joined_at": q.joined_at
        } for q in queue
    ]

@router.put("/{queue_id}/status")
async def update_queue_status(queue_id: int, req: QueueUpdate, db: Session = Depends(get_db)):
    """Updates status (e.g. Doctor calls them in)."""
    entry = db.query(PatientQueue).filter(PatientQueue.queue_id == queue_id).first()
    if not entry: 
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    entry.status = req.status
    if req.status == "Completed":
        entry.completed_at = func.now()
        
    db.commit()
    
    # Trigger UI update across the hospital
    await manager.broadcast(json.dumps({"event": "queue_updated", "department": entry.department}))
    return {"message": f"Status updated to {req.status}"}