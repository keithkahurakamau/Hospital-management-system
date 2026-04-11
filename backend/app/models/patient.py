from sqlalchemy import Column, Integer, String, Date, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.config.database import Base

class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = {'extend_existing': True}

    patient_id = Column(Integer, primary_key=True, index=True)
    
    # System Generated Identifiers
    outpatient_no = Column(String(50), unique=True, index=True, nullable=True)
    inpatient_no = Column(String(50), unique=True, index=True, nullable=True)

    # Core Demographics (Mapped to Image)
    surname = Column(String(100), nullable=False)
    other_names = Column(String(150), nullable=False)
    sex = Column(String(20), nullable=False)
    date_of_birth = Column(String(50), nullable=False) 
    blood_group = Column(String(5), nullable=True)
    # Identification
    id_type = Column(String(50), nullable=False)
    id_number = Column(String(50), nullable=True)
    nationality = Column(String(50), nullable=False)

    # Contact Details
    telephone_1 = Column(String(20), nullable=False)
    telephone_2 = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)

    # Spatial/Location Data
    postal_address = Column(String(100), nullable=True)
    postal_code = Column(String(50), nullable=True)
    residence = Column(String(100), nullable=False)
    town = Column(String(100), nullable=False)

    # Meta
    occupation = Column(String(100), nullable=False)
    reference_number = Column(String(100), nullable=True)

    # Next of Kin (NOK) Matrix
    nok_name = Column(String(150), nullable=False)
    nok_relationship = Column(String(50), nullable=False)
    nok_contact = Column(String(20), nullable=False)

    # Operational Parameters
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True) # Enables Deactivate action
    registered_on = Column(DateTime(timezone=True), server_default=func.now())