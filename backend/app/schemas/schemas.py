from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal

# --- Patient Schemas ---
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: EmailStr
    address: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    patient_id: int
    date_registered: datetime

    # Pydantic V2 syntax for ORM compatibility
    model_config = ConfigDict(from_attributes=True)

# --- Doctor Schemas ---
class DoctorBase(BaseModel):
    first_name: str
    last_name: str
    specialization: str
    phone: Optional[str] = None
    email: EmailStr
    availability_schedule: Optional[str] = None

class DoctorCreate(DoctorBase):
    pass

class DoctorResponse(DoctorBase):
    doctor_id: int

    model_config = ConfigDict(from_attributes=True)

# --- Appointment Schemas ---
class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    status: Optional[str] = "scheduled"
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentResponse(AppointmentBase):
    appointment_id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- Analytics Schemas ---
class RevenueData(BaseModel):
    months: List[str]
    values: List[float]

class DashboardAnalytics(BaseModel):
    total_patients: int
    appointments_today: int
    total_revenue: float
    revenue: RevenueData

    model_config = ConfigDict(from_attributes=True)