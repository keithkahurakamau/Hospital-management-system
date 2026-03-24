from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class DispenseLog(Base):
    """Records every time a drug leaves the pharmacy"""
    __tablename__ = "dispense_logs"
    __table_args__ = {'extend_existing': True}

    dispense_id = Column(Integer, primary_key=True, index=True)
    
    # Links to the specific physical batch the drug was taken from
    batch_id = Column(Integer, ForeignKey("stock_batches.batch_id"), nullable=False)
    
    # If None, it's a Walk-in Sale. If filled, it's a Patient Prescription.
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=True)
    record_id = Column(Integer, ForeignKey("medical_records.record_id"), nullable=True)
    
    quantity_dispensed = Column(Integer, nullable=False)
    total_cost = Column(Float, nullable=False)
    dispensed_by = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=False) # Acting as Pharmacist
    
    dispensed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(255))

    batch = relationship("StockBatch")
    patient = relationship("Patient")