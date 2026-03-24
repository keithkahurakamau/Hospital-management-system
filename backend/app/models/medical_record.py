from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.config.database import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    record_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"))
    
    # Vitals Block
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    
    # Clinical Block
    chief_complaint = Column(Text, nullable=False)
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    prescription_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())