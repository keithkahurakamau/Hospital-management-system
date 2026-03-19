from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from app.config.database import get_db
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment

# The prefix matches the endpoint the frontend is calling: /api/records
router = APIRouter(prefix="/api/records", tags=["Medical Records"])

# --- PYDANTIC SCHEMAS ---
class RecordCreate(BaseModel):
    patient_id: int
    doctor_id: int = 1  # Defaulting to 1 for prototyping
    appointment_id: Optional[int] = None
    
    # Real-World Vitals
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    temperature: Optional[float] = None
    weight_kg: Optional[float] = None
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    
    # Clinical Documentation
    chief_complaint: Optional[str] = None
    clinical_notes: Optional[str] = None
    diagnosis_code: Optional[str] = None  # e.g., ICD-10 Codes
    treatment_plan: Optional[str] = None

# --- ENDPOINTS ---

# THE FIX: Stacked decorators catch the request with AND without the slash.
# include_in_schema=False prevents duplicates from showing up in your /docs UI
@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_medical_record(record: RecordCreate, db: Session = Depends(get_db)):
    """Saves a new clinical note from the consultation workstation."""
    
    # 1. Safety Checks (Referential Integrity)
    if not db.query(Patient).filter(Patient.patient_id == record.patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found in registry")
    
    if not db.query(Doctor).filter(Doctor.doctor_id == record.doctor_id).first():
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    if record.appointment_id and not db.query(Appointment).filter(Appointment.appointment_id == record.appointment_id).first():
        raise HTTPException(status_code=404, detail="Appointment link invalid")

    # 2. Save the Record safely
    record_data = record.model_dump(exclude_unset=True)
    new_record = MedicalRecord(**record_data)
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return new_record

# THE FIX: Stacked decorators for the GET endpoint as well
@router.get("")
@router.get("/", include_in_schema=False)
def get_all_records(db: Session = Depends(get_db)):
    """Fetches a high-level list of recent clinical records for admin views."""
    
    records = db.query(MedicalRecord).options(
        joinedload(MedicalRecord.patient),
        joinedload(MedicalRecord.doctor)
    ).order_by(MedicalRecord.created_at.desc()).limit(50).all()

    return [
        {
            "record_id": r.record_id,
            "patient_name": f"{r.patient.first_name} {r.patient.last_name}",
            "doctor_name": f"Dr. {r.doctor.last_name}",
            "diagnosis_code": r.diagnosis_code,
            "date": r.created_at.strftime("%Y-%m-%d %H:%M")
        } for r in records
    ]

@router.get("/patient/{patient_id}")
def get_patient_history(patient_id: int, db: Session = Depends(get_db)):
    """Fetches the complete clinical history for a single patient."""
    
    records = db.query(MedicalRecord).options(
        joinedload(MedicalRecord.doctor)
    ).filter(MedicalRecord.patient_id == patient_id)\
     .order_by(MedicalRecord.created_at.desc()).all()

    if not records:
        return []

    return [
        {
            "record_id": r.record_id,
            "doctor_name": f"Dr. {r.doctor.last_name}",
            "diagnosis_code": r.diagnosis_code,
            "chief_complaint": r.chief_complaint,
            "treatment_plan": r.treatment_plan,
            "vitals": {
                "bp": f"{r.systolic_bp}/{r.diastolic_bp}" if r.systolic_bp else "N/A",
                "temp": f"{r.temperature}°C" if r.temperature else "N/A",
                "weight": f"{r.weight_kg} kg" if r.weight_kg else "N/A"
            },
            "date": r.created_at.strftime("%b %d, %Y")
        } for r in records
    ]