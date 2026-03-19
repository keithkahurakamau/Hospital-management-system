from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class LabTest(Base):
    __tablename__ = "lab_tests"
    __table_args__ = {'extend_existing': True}

    test_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=False)
    
    test_name = Column(String(100), nullable=False) # e.g., "Complete Blood Count", "MRI"
    status = Column(String(50), default="Pending")  # States: Pending, Completed
    result_summary = Column(Text, nullable=True)    # The actual lab findings
    
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    patient = relationship("Patient")
    doctor = relationship("Doctor")