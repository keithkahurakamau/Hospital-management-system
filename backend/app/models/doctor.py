from sqlalchemy import Column, Integer, String
from app.config.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    specialization = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100), unique=True, index=True)
    availability_schedule = Column(String(255))