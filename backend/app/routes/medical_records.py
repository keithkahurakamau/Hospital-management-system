from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.config.database import get_db
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.user import User
from app.models.queue import PatientQueue
from app.core.security import get_current_user

router = APIRouter(prefix="/api/medical-records", tags=["Clinical Records"])

# --- PYDANTIC SCHEMAS ---
class RecordCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    
    # Vitals (Triage Data)
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    temperature: Optional[float] = None
    weight_kg: Optional[float] = None
    
    # Clinical Documentation (Consultation Data)
    chief_complaint: str # Required by model constraint
    diagnosis: Optional[str] = None 
    treatment_plan: Optional[str] = None
    prescription_notes: Optional[str] = None

# --- ENDPOINTS ---

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_medical_record(record: RecordCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Saves a new clinical note from the consultation workstation."""
    
    # 1. Verify Patient exists
    if not db.query(Patient).filter(Patient.patient_id == record.patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found in registry")
    
    # 2. Extract Doctor ID from current session (sub is usually the email)
    doctor_id = record.doctor_id
    if not doctor_id:
        user = db.query(User).filter(User.email == current_user.get("sub")).first()
        doctor_id = user.user_id if user else None
        
    if not doctor_id:
        raise HTTPException(status_code=400, detail="Could not determine responsible physician.")

    # 3. Initialize Model with exact fields from medical_record.py
    new_record = MedicalRecord(
        patient_id=record.patient_id,
        doctor_id=doctor_id,
        systolic_bp=record.systolic_bp,
        diastolic_bp=record.diastolic_bp,
        temperature=record.temperature,
        weight_kg=record.weight_kg,
        chief_complaint=record.chief_complaint,
        diagnosis=record.diagnosis,
        treatment_plan=record.treatment_plan,
        prescription_notes=record.prescription_notes
    )
    
    try:
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit failed: {str(e)}")

@router.get("/{patient_id}")
def get_patient_clinical_summary(patient_id: int, db: Session = Depends(get_db)):
    """Fetches a 360-degree clinical view for the Doctor's Consultation UI."""
    
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Fetch Clinical encounters (Doctor Visits)
    encounters = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == patient_id
    ).order_by(desc(MedicalRecord.created_at)).all()

    # Fetch Lab handoffs (to see what was ordered previously)
    lab_history = db.query(PatientQueue).filter(
        PatientQueue.patient_id == patient_id,
        PatientQueue.department == "Laboratory"
    ).order_by(desc(PatientQueue.joined_at)).all()

    return {
        "demographics": {
            "name": f"{patient.surname}, {patient.other_names}",
            "op_no": patient.outpatient_no,
            "age_sex": f"{patient.sex} | {patient.date_of_birth}",
            "contact": patient.telephone_1,
            "residence": f"{patient.residence}, {patient.town}"
        },
        "encounters": [
            {
                "date": e.created_at.strftime("%Y-%m-%d %H:%M"),
                "complaint": e.chief_complaint,
                "diagnosis": e.diagnosis or "Pending",
                "treatment": e.treatment_plan,
                "prescription": e.prescription_notes,
                "vitals": {
                    "bp": f"{e.systolic_bp}/{e.diastolic_bp}" if e.systolic_bp else "N/A",
                    "temp": f"{e.temperature}°C" if e.temperature else "N/A",
                    "weight": f"{e.weight_kg} kg" if e.weight_kg else "N/A"
                }
            } for e in encounters
        ],
        "lab_history": [
            {
                "date": l.joined_at.strftime("%Y-%m-%d %H:%M"),
                "status": l.status,
                "urgency": l.acuity_level
            } for l in lab_history
        ]
    }

@router.get("")
@router.get("/", include_in_schema=False)
def list_all_records(db: Session = Depends(get_db)):
    """General audit list of medical records."""
    records = db.query(MedicalRecord).options(
        joinedload(MedicalRecord.patient)
    ).order_by(MedicalRecord.created_at.desc()).limit(100).all()

    return [
        {
            "record_id": r.record_id,
            "patient_name": f"{r.patient.surname}, {r.patient.other_names}" if r.patient else "Unknown",
            "diagnosis": r.diagnosis or "N/A",
            "date": r.created_at.strftime("%Y-%m-%d %H:%M")
        } for r in records
    ]