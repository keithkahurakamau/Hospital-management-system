from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from app.config.database import get_db
from app.models.bed import Bed
from app.models.patient import Patient

router = APIRouter(prefix="/api/beds", tags=["Bed Management"])

class BedCreate(BaseModel):
    ward_name: str
    bed_number: str

class AdmissionUpdate(BaseModel):
    patient_id: int

@router.get("/")
def get_all_beds(db: Session = Depends(get_db)):
    """Retrieves the global bed matrix with current patient occupancy."""
    beds = db.query(Bed).options(joinedload(Bed.patient)).order_by(Bed.ward_name, Bed.bed_number).all()
    
    return [
        {
            "bed_id": b.bed_id,
            "ward_name": b.ward_name,
            "bed_number": b.bed_number,
            "status": b.status,
            # FIXED: Updated to use 'other_names' and 'surname' instead of first/last name
            "patient_name": f"{b.patient.other_names} {b.patient.surname}" if b.patient else None,
            "patient_id": b.patient_id
        } for b in beds
    ]

@router.post("/", status_code=status.HTTP_201_CREATED)
def initialize_bed(bed: BedCreate, db: Session = Depends(get_db)):
    """Provisions a new physical bed in the system."""
    if db.query(Bed).filter(Bed.bed_number == bed.bed_number).first():
        raise HTTPException(status_code=400, detail="Bed number already exists.")
    
    new_bed = Bed(ward_name=bed.ward_name, bed_number=bed.bed_number)
    db.add(new_bed)
    db.commit()
    db.refresh(new_bed)
    return new_bed

@router.patch("/{bed_id}/admit")
def admit_patient(bed_id: int, admission: AdmissionUpdate, db: Session = Depends(get_db)):
    """Transitions a bed to 'Occupied' and assigns a patient."""
    bed = db.query(Bed).filter(Bed.bed_id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    if bed.status != "Available":
        raise HTTPException(status_code=400, detail=f"Bed is currently {bed.status}")
        
    patient = db.query(Patient).filter(Patient.patient_id == admission.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in registry")

    bed.status = "Occupied"
    bed.patient_id = admission.patient_id
    db.commit()
    return {"message": "Patient admitted successfully"}

@router.patch("/{bed_id}/discharge")
def discharge_patient(bed_id: int, db: Session = Depends(get_db)):
    """Frees the bed and sets status to Maintenance for cleaning."""
    bed = db.query(Bed).filter(Bed.bed_id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    bed.status = "Maintenance"
    bed.patient_id = None
    db.commit()
    return {"message": "Patient discharged. Bed requires maintenance."}

@router.patch("/{bed_id}/clean")
def mark_bed_clean(bed_id: int, db: Session = Depends(get_db)):
    """Transitions a bed from Maintenance to Available."""
    bed = db.query(Bed).filter(Bed.bed_id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    bed.status = "Available"
    db.commit()
    return {"message": "Bed is now available for admission."}