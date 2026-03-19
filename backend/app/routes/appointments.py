from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.config.database import get_db
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.patient import Patient

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

# --- PYDANTIC SCHEMAS ---
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    notes: Optional[str] = None

# --- CREATE ---
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    # Validate Referential Integrity
    if not db.query(Patient).filter(Patient.patient_id == appointment.patient_id).first():
        raise HTTPException(status_code=404, detail="Specified Patient does not exist.")
    
    if not db.query(Doctor).filter(Doctor.doctor_id == appointment.doctor_id).first():
        raise HTTPException(status_code=404, detail="Specified Doctor does not exist.")
    
    # Use .model_dump() for Pydantic V2 compatibility
    db_appointment = Appointment(**appointment.model_dump())
    db_appointment.status = "Scheduled" # Enforce strict casing for UI
    
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    return {"message": "Appointment scheduled successfully", "id": db_appointment.appointment_id}

# --- READ ALL (Formatted for React UI) ---
@router.get("/")
def read_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieves appointments and joins relational data for the master schedule."""
    appointments = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor)
    ).order_by(Appointment.appointment_date.asc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": a.appointment_id,
            "patient_name": f"{a.patient.first_name} {a.patient.last_name}",
            "doctor_name": f"Dr. {a.doctor.last_name} ({a.doctor.specialization})",
            "date": a.appointment_date.strftime("%Y-%m-%d"),
            "time": a.appointment_date.strftime("%H:%M"),
            "status": a.status,
            "notes": a.notes
        } for a in appointments
    ]

# --- READ SINGLE ---
@router.get("/{appointment_id}")
def read_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment record not found.")
    return appointment

# --- UPDATE STATUS ---
@router.patch("/{appointment_id}/status")
def update_appointment_status(appointment_id: int, status: str, db: Session = Depends(get_db)):
    db_appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment record not found.")
    
    # Auto-correct casing to match React frontend requirements
    formatted_status = status.capitalize()
    valid_statuses = ["Scheduled", "Completed", "Cancelled"]
    
    if formatted_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    db_appointment.status = formatted_status
    db.commit()
    return {"message": f"Appointment mutated to {formatted_status}"}

# --- DELETE ---
@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_and_delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    db_appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment record not found.")
    
    db.delete(db_appointment)
    db.commit()
    return {"message": "Appointment successfully deleted"}