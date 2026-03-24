from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.config.database import Base

class PatientQueue(Base):
    __tablename__ = "patient_queues"
    __table_args__ = {'extend_existing': True}

    queue_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"))
    department = Column(String(50), nullable=False) # e.g., 'Consultation', 'Lab'
    acuity_level = Column(Integer, default=3)      # 1: Emergency, 2: Urgent, 3: Standard
    status = Column(String(20), default="waiting") # 'waiting', 'in-progress', 'completed'
    
    # Ensure this matches the name used in the order_by clause
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)