from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.config.database import get_db
from app.models.doctor import Doctor

router = APIRouter(prefix="/api/doctors", tags=["Staff Directory"])

# --- PYDANTIC SCHEMAS ---
class DoctorCreate(BaseModel):
    first_name: str
    last_name: str
    specialization: str
    phone: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = "General Medicine"

# --- ENDPOINTS ---
@router.get("/")
def get_doctors(db: Session = Depends(get_db)):
    """Retrieves the complete staff directory formatted for the React UI."""
    doctors = db.query(Doctor).order_by(Doctor.last_name).all()
    
    return [
        {
            "doctor_id": d.doctor_id,
            "first_name": d.first_name,
            "last_name": d.last_name,
            "specialization": d.specialization,
            # getattr acts as a safety net if these columns are missing in the current DB schema
            "department": getattr(d, 'department', 'General Medicine'), 
            "phone": getattr(d, 'phone', 'N/A'),
            "email": getattr(d, 'email', 'N/A'),
            "status": "Active" # Required by the UI to render the green pulse badge
        } for d in doctors
    ]

@router.post("/", status_code=status.HTTP_201_CREATED)
def add_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    """Registers a new physician into the system."""
    db_doctor = Doctor(**doctor.model_dump())
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Removes a physician from the directory."""
    db_doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    db.delete(db_doctor)
    db.commit()
    return {"message": "Doctor successfully removed"}