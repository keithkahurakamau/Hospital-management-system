from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.config.database import get_db
from app.models.queue import PatientQueue
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.core.security import require_clinical_access # Importing the RBAC lock

router = APIRouter(prefix="/api/clinical", tags=["Clinical Workstation"])

# --- DATA TRANSFER OBJECTS (DTOs) ---

class ConsultationRequest(BaseModel):
    patient_id: int
    queue_id: int
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    temp: Optional[float] = None
    weight: Optional[float] = None
    complaint: str
    diagnosis: str
    plan: str
    prescription: Optional[str] = None

# --- CLINICAL ENDPOINTS ---

@router.get("/queue", dependencies=[Depends(require_clinical_access)])
def get_doctor_queue(db: Session = Depends(get_db)):
    """
    Fetches patients specifically queued for the Doctor.
    Prioritizes based on Acuity Level (1=Emergency) then Time Joined.
    """
    results = db.query(PatientQueue, Patient).join(
        Patient, PatientQueue.patient_id == Patient.patient_id
    ).filter(
        PatientQueue.status == "waiting", 
        PatientQueue.department == "Consultation"
    ).order_by(
        PatientQueue.acuity_level.asc(), 
        PatientQueue.joined_at.asc()
    ).all()

    # Formats the flat SQLAlchemy join into a clean object for the React frontend
    return [
        {
            "PatientQueue": {
                "queue_id": q.queue_id,
                "acuity_level": q.acuity_level,
                "joined_at": q.joined_at
            },
            "Patient": {
                "patient_id": p.patient_id,
                "outpatient_no": p.outpatient_no,
                "surname": p.surname,
                "other_names": p.other_names,
                "sex": p.sex
            }
        } for q, p in results
    ]

@router.post("/submit", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_clinical_access)])
def submit_consultation(data: ConsultationRequest, db: Session = Depends(get_db)):
    """
    The 'Digital Handshake':
    Saves the clinical record and automatically marks the queue entry as completed.
    """
    
    # 1. Integrity Check: Ensure queue entry exists and is still active
    q_entry = db.query(PatientQueue).filter(
        PatientQueue.queue_id == data.queue_id,
        PatientQueue.status == "waiting"
    ).first()
    
    if not q_entry:
        raise HTTPException(
            status_code=404, 
            detail="Queue entry not found or already processed."
        )

    try:
        # 2. Persist the Medical Record (The Clinical Node)
        record = MedicalRecord(
            patient_id=data.patient_id,
            systolic_bp=data.systolic,
            diastolic_bp=data.diastolic,
            temperature=data.temp,
            weight_kg=data.weight,
            chief_complaint=data.complaint,
            diagnosis=data.diagnosis,
            treatment_plan=data.plan,
            prescription_notes=data.prescription
        )
        db.add(record)

        # 3. Update Queue Lifecycle (The Operational Node)
        q_entry.status = "completed"
        q_entry.completed_at = datetime.now()

        db.commit()
        return {"status": "success", "message": "Consultation finalized and synced."}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Database synchronization failed: {str(e)}"
        )