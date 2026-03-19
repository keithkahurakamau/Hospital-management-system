import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.config.database import SessionLocal, engine, Base
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.billing import Billing
from faker import Faker

fake = Faker()

def seed_data():
    db = SessionLocal()
    print("🚀 Initializing System Saturation...")

    # 1. Seed Doctors (The Staff)
    specializations = ["Cardiology", "Neurology", "Pediatrics", "Oncology", "General Surgery", "Dermatology"]
    doctors = []
    for _ in range(12):
        doc = Doctor(
            first_name=fake.first_name_male() if random.random() > 0.5 else fake.first_name_female(),
            last_name=fake.last_name(),
            specialization=random.choice(specializations),
            phone=fake.phone_number()[:15],
            email=fake.email(),
            availability_schedule="Mon-Fri, 08:00-17:00"
        )
        db.add(doc)
        doctors.append(doc)
    
    db.commit()
    print(f"✅ Onboarded {len(doctors)} Medical Practitioners.")

    # 2. Seed Patients (The Registry)
    patients = []
    for _ in range(50):
        pat = Patient(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            date_of_birth=fake.date_of_birth(minimum_age=1, maximum_age=90),
            gender=random.choice(["Male", "Female", "Other"]),
            phone=fake.phone_number()[:15],
            email=fake.unique.email(),
            address=fake.address().replace('\n', ', ')
        )
        db.add(pat)
        patients.append(pat)
    
    db.commit()
    print(f"✅ Registered {len(patients)} Patients.")

    # 3. Seed Appointments & Interconnected Records
    statuses = ["scheduled", "completed", "cancelled"]
    billing_statuses = ["Pending", "Paid", "Insurance Claimed"]
    
    print("🔗 Linking Clinical Data & Financials...")
    for _ in range(100):
        # Pick a random patient and doctor
        patient = random.choice(patients)
        doctor = random.choice(doctors)
        
        # Random date within last 30 days or next 7 days
        apt_date = datetime.now() + timedelta(days=random.randint(-30, 7), hours=random.randint(0, 23))
        
        status = random.choice(statuses)
        
        apt = Appointment(
            patient_id=patient.patient_id,
            doctor_id=doctor.doctor_id,
            appointment_date=apt_date,
            status=status,
            notes=fake.sentence(nb_words=10)
        )
        db.add(apt)
        db.flush() # Get the ID for foreign keys

        # If appointment is completed, generate a Medical Record and a Bill
        if status == "completed":
            # Clinical Record
            record = MedicalRecord(
                patient_id=patient.patient_id,
                doctor_id=doctor.doctor_id,
                appointment_id=apt.appointment_id,
                diagnosis=fake.paragraph(nb_sentences=3),
                treatment_plan=fake.sentence(nb_words=12),
                vitals_bp=f"{random.randint(110,140)}/{random.randint(70,90)}",
                vitals_temp=f"{random.uniform(36.1, 37.5):.1f}"
            )
            db.add(record)

            # Financial Record (Billing)
            bill = Billing(
                patient_id=patient.patient_id,
                appointment_id=apt.appointment_id,
                total_amount=random.uniform(150.0, 2500.0),
                status=random.choice(billing_statuses),
                billing_date=apt_date
            )
            db.add(bill)

    db.commit()
    db.close()
    print("⭐ System Saturation Complete. All modules synchronized.")

if __name__ == "__main__":
    seed_data()