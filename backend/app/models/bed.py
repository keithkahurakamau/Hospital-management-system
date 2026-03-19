from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import Base

class Bed(Base):
    __tablename__ = "beds"
    __table_args__ = {'extend_existing': True}

    bed_id = Column(Integer, primary_key=True, index=True)
    ward_name = Column(String(50), nullable=False)
    bed_number = Column(String(20), nullable=False, unique=True)
    status = Column(String(20), default="Available") # States: Available, Occupied, Maintenance
    
    # Nullable because an empty bed has no patient
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=True)

    patient = relationship("Patient")