from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from app.config.database import get_db
from app.models.patient import Patient

router = APIRouter(prefix="/api/patients", tags=["Patient Registry"])

# --- DATA TRANSFER OBJECTS (DTOs) ---

class PatientCreate(BaseModel):
    # Core Bio
    surname: str
    other_names: str
    sex: str
    date_of_birth: str
    
    # Identification
    id_type: str
    id_number: Optional[str] = None
    nationality: str
    
    # Contact
    telephone_1: str
    telephone_2: Optional[str] = None
    email: Optional[str] = None
    
    # Location & Meta
    postal_address: Optional[str] = None
    postal_code: Optional[str] = None
    residence: str
    town: str
    occupation: str
    reference_number: Optional[str] = None
    
    # Next of Kin
    nok_name: str
    nok_relationship: str
    nok_contact: str
    notes: Optional[str] = None

class PatientResponse(PatientCreate):
    patient_id: int
    outpatient_no: str
    is_active: bool
    registered_on: datetime

    class Config:
        from_attributes = True

# --- HELPER: AUTO-GENERATE OP NUMBER ---
def generate_outpatient_no(db: Session) -> str:
    """Generates a sequential OP number: OP-YYYY-XXXX"""
    current_year = datetime.now().year
    prefix = f"OP-{current_year}-"
    
    # Get the last patient registered this year
    last_patient = db.query(Patient).filter(Patient.outpatient_no.like(f"{prefix}%"))\
                     .order_by(desc(Patient.patient_id)).first()
    
    if last_patient and last_patient.outpatient_no:
        try:
            last_sequence = int(last_patient.outpatient_no.split("-")[-1])
            new_sequence = last_sequence + 1
        except ValueError:
            new_sequence = 1
    else:
        new_sequence = 1
        
    return f"{prefix}{new_sequence:04d}" # e.g., OP-2026-0001


# --- ENDPOINTS ---

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    """User Story 1.1: Register a new patient with duplicate detection."""
    
    # Duplicate Detection Check (Epic 1 Requirement)
    existing_patient = db.query(Patient).filter(
        or_(
            Patient.telephone_1 == patient.telephone_1,
            (Patient.id_number == patient.id_number) & (Patient.id_number != None)
        )
    ).first()
    
    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient with this Telephone or ID Number already exists.")

    # Generate OP Number and map data
    db_patient = Patient(**patient.model_dump())
    db_patient.outpatient_no = generate_outpatient_no(db)
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


@router.get("/", response_model=List[PatientResponse])
def get_all_patients(search: Optional[str] = None, include_inactive: bool = False, db: Session = Depends(get_db)):
    """User Story 1.2: Search and list patients."""
    query = db.query(Patient)
    
    if not include_inactive:
        query = query.filter(Patient.is_active == True)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Patient.surname.ilike(search_term),
                Patient.other_names.ilike(search_term),
                Patient.telephone_1.ilike(search_term),
                Patient.outpatient_no.ilike(search_term)
            )
        )
        
    return query.order_by(desc(Patient.registered_on)).limit(100).all()


# --- NEW: GET SPECIFIC PATIENT ---
@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient_by_id(patient_id: int, db: Session = Depends(get_db)):
    """Fetches a single patient's complete bio-data."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in registry")
    return patient


# --- NEW: UPDATE PATIENT BIO-DATA ---
@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: int, patient_data: PatientCreate, db: Session = Depends(get_db)):
    """Updates an existing patient's bio-data."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in registry")

    # Duplicate check: Ensure we aren't changing their phone/ID to one that belongs to someone else
    duplicate_check = db.query(Patient).filter(
        or_(
            Patient.telephone_1 == patient_data.telephone_1,
            (Patient.id_number == patient_data.id_number) & (Patient.id_number != None)
        ),
        Patient.patient_id != patient_id # Exclude the current patient from the check
    ).first()

    if duplicate_check:
        raise HTTPException(status_code=400, detail="Another patient with this Telephone or ID Number already exists.")

    # Apply updates
    for key, value in patient_data.model_dump().items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.put("/{patient_id}/deactivate", status_code=status.HTTP_200_OK)
def deactivate_patient(patient_id: int, db: Session = Depends(get_db)):
    """Action: Soft delete a patient."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    patient.is_active = False
    db.commit()
    return {"status": "success", "message": f"Patient {patient.outpatient_no} deactivated."}


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Action: Hard delete a patient (Admin only)."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    db.delete(patient)
    db.commit()
    return None