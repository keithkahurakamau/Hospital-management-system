from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    record_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    # --- Vitals Block (Captured at Triage) ---
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    
    # --- Clinical Block (Captured by Doctor) ---
    chief_complaint = Column(Text, nullable=False)
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    prescription_notes = Column(Text, nullable=True)
    
    # System Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    # These allow us to use .patient and .doctor in our routes
    patient = relationship("Patient")
    doctor = relationship("User")