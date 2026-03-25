from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class PatientQueue(Base):
    __tablename__ = "patient_queues"
    __table_args__ = {'extend_existing': True}

    queue_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    
    # Routing: 'Consultation', 'Laboratory', 'Pharmacy'
    department = Column(String(50), nullable=False) 
    
    # 1: Emergency, 2: Urgent, 3: Standard
    acuity_level = Column(Integer, default=3)      
    
    # 'Waiting', 'In Progress', 'Completed'
    status = Column(String(20), default="Waiting") 
    notes = Column(String(255), nullable=True)
    
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Establish relationship to fetch patient names easily
    patient = relationship("Patient")