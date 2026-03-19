from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.config.database import Base

class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = {'extend_existing': True}

    appointment_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="scheduled")
    notes = Column(Text)

    patient = relationship("Patient")
    doctor = relationship("Doctor")
