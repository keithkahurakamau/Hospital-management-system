from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.config.database import get_db
from app.models.patient import Patient

router = APIRouter(prefix="/api/patients", tags=["Patients"])

# --- PYDANTIC SCHEMAS (Inline for Architectural Stability) ---
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str
    phone: str
    id_number: str
    gender: str
    insurance_type: str

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    insurance_type: Optional[str] = None

# --- ENDPOINTS ---

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    """Registers a new patient with National ID uniqueness validation."""
    
    # 1. Prevent 500 Server Crashes by intercepting duplicates gracefully
    existing_patient = db.query(Patient).filter(Patient.id_number == patient.id_number).first()
    if existing_patient:
        raise HTTPException(status_code=400, detail="A patient with this National ID is already registered.")
    
    # 2. Safe Injection
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/")
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieves the master index, latest registrations first."""
    return db.query(Patient).order_by(Patient.patient_id.desc()).offset(skip).limit(limit).all()

@router.get("/{patient_id}")
def read_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    return patient

@router.put("/{patient_id}")
def update_patient(patient_id: int, updated_data: PatientUpdate, db: Session = Depends(get_db)):
    db_patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    
    # exclude_unset=True ensures we only update fields the user actually provided
    update_dict = updated_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_patient, key, value)
    
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    db_patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    
    db.delete(db_patient)
    db.commit()
    return {"message": "Patient successfully removed from registry"}