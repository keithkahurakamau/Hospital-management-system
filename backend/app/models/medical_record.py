from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    __table_args__ = {'extend_existing': True}

    record_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id"), nullable=True)
    
    diagnosis = Column(Text, nullable=False)
    treatment_plan = Column(Text)
    prescriptions = Column(Text) # Will evolve into a separate table for Pharmacy integration
    vitals_bp = Column(String(20)) # Blood Pressure
    vitals_temp = Column(String(10)) # Temperature
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    doctor = relationship("Doctor")