from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.config.database import Base

class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = {'extend_existing': True}

    patient_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    date_of_birth = Column(String(20), nullable=False)
    phone = Column(String(20), nullable=False)
    id_number = Column(String(50), unique=True, index=True) # Essential for eTIMS uniqueness
    gender = Column(String(20))
    insurance_type = Column(String(50), default="CASH")
    created_at = Column(DateTime(timezone=True), server_default=func.now())