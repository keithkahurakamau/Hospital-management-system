from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.config.database import Base

class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = {'extend_existing': True}

    appointment_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    
    # 🚨 FIXED: Points to the 'users' table, not 'doctors'
    doctor_id = Column(Integer, ForeignKey("users.user_id"), nullable=False) 
    
    appointment_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="Scheduled") # Use Capitalized to match React logic
    notes = Column(Text)

    # Relationships
    # This allows SQLAlchemy to automatically fetch the Patient/User object
    patient = relationship("Patient")
    
    # 🚨 FIXED: Links to the User model
    doctor = relationship("User")