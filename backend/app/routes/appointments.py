from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.config.database import get_db
from app.models.appointment import Appointment
from app.models.user import User  # Doctors are Users with role='DOCTOR'
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
    # 1. Validate Patient Existence
    if not db.query(Patient).filter(Patient.patient_id == appointment.patient_id).first():
        raise HTTPException(status_code=404, detail="Specified Patient does not exist.")
    
    # 2. Validate Doctor (User must exist AND have the DOCTOR role)
    doctor = db.query(User).filter(
        User.user_id == appointment.doctor_id, 
        User.role == "DOCTOR"
    ).first()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Specified Physician not found or invalid role.")
    
    # 3. Create Record
    db_appointment = Appointment(
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        notes=appointment.notes,
        status="Scheduled"
    )
    
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    return {
        "message": "Appointment scheduled successfully", 
        "id": db_appointment.appointment_id
    }

# --- READ ALL (Formatted for React UI) ---
@router.get("/")
def read_appointments(db: Session = Depends(get_db)):
    """Retrieves appointments and joins relational data for the master schedule."""
    # Explicitly load patient and doctor relationships to prevent 'None' values
    appointments = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor)
    ).order_by(Appointment.appointment_date.asc()).all()
    
    return [
        {
            "id": a.appointment_id,
            # SYNCED: Using surname and other_names from your Registry
            "patient_name": f"{a.patient.surname}, {a.patient.other_names}" if a.patient else "Unknown Patient",
            "doctor_name": f"Dr. {a.doctor.full_name}" if a.doctor else "Unknown Doctor",
            "date": a.appointment_date.strftime("%Y-%m-%d"),
            "time": a.appointment_date.strftime("%I:%M %p"),
            "status": a.status,
            "notes": a.notes
        } for a in appointments
    ]

# --- UPDATE STATUS ---
@router.patch("/{appointment_id}/status")
def update_appointment_status(appointment_id: int, status: str, db: Session = Depends(get_db)):
    db_appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment record not found.")
    
    db_appointment.status = status
    db.commit()
    return {"message": f"Appointment mark as {status}"}