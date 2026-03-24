import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.config.database import SessionLocal, engine, Base

# Import all models
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.billing import Billing, InvoiceItem
from app.models.inventory import Location, InventoryItem, StockBatch
from faker import Faker

fake = Faker()

def seed_data():
    db = SessionLocal()
    print("🚀 Initializing System Saturation...")

    # ==========================================
    # 1. SEED LOCATIONS & INVENTORY
    # ==========================================
    print("📦 Building Storage Locations & Drug Catalog...")
    
    # Locations
    loc_pharmacy = Location(name="Main Pharmacy", description="Central Dispensing Unit")
    loc_lab = Location(name="Lab Store", description="Reagents and Consumables")
    db.add_all([loc_pharmacy, loc_lab])
    db.commit()

    # Inventory Catalog
    catalog = [
        {"name": "Paracetamol 500mg", "cat": "Drug", "price": 5.0},
        {"name": "Amoxicillin 250mg", "cat": "Drug", "price": 15.0},
        {"name": "Ibuprofen 400mg", "cat": "Drug", "price": 8.0},
        {"name": "Omeprazole 20mg", "cat": "Drug", "price": 20.0},
        {"name": "Ceftriaxone 1g Injection", "cat": "Drug", "price": 150.0},
        {"name": "Disposable Syringe 5ml", "cat": "Consumable", "price": 10.0},
        {"name": "Malaria Rapid Test Kit", "cat": "Reagent", "price": 50.0}
    ]

    items = []
    for index, item_data in enumerate(catalog):
        item = InventoryItem(
            item_code=f"ITM-{1000 + index}",
            name=item_data["name"],
            category=item_data["cat"],
            unit_price=item_data["price"],
            reorder_threshold=50
        )
        db.add(item)
        items.append(item)
    db.commit()

    # Stock Batches (Creating Multiple Batches to test FEFO)
    print("📦 Generating Stock Batches & Expiry Dates...")
    for item in items:
        # Batch 1: Expires soon (e.g., 30-90 days)
        batch1 = StockBatch(
            item_id=item.item_id,
            location_id=loc_pharmacy.location_id if item.category != "Reagent" else loc_lab.location_id,
            batch_number=f"BCH-{fake.random_number(digits=6)}",
            quantity=random.randint(20, 100),
            expiry_date=datetime.now(timezone.utc) + timedelta(days=random.randint(30, 90))
        )
        # Batch 2: Expires much later (e.g., 1-2 years)
        batch2 = StockBatch(
            item_id=item.item_id,
            location_id=loc_pharmacy.location_id if item.category != "Reagent" else loc_lab.location_id,
            batch_number=f"BCH-{fake.random_number(digits=6)}",
            quantity=random.randint(100, 300),
            expiry_date=datetime.now(timezone.utc) + timedelta(days=random.randint(365, 730))
        )
        db.add_all([batch1, batch2])
    db.commit()

    # ==========================================
    # 2. SEED STAFF & PATIENTS
    # ==========================================
    specializations = ["Cardiology", "Neurology", "Pediatrics", "General Practice", "Pharmacy"]
    doctors = []
    for _ in range(12):
        doc = Doctor(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            specialization=random.choice(specializations),
            phone=f"07{fake.random_number(digits=8, fix_len=True)}",
            email=fake.email(),
            availability_schedule="Mon-Fri, 08:00-17:00"
        )
        db.add(doc)
        doctors.append(doc)
    db.commit()
    print(f"✅ Onboarded {len(doctors)} Medical Staff.")

    patients = []
    for _ in range(30):
        pat = Patient(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            date_of_birth=str(fake.date_of_birth(minimum_age=1, maximum_age=90)),
            gender=random.choice(["Male", "Female", "Other"]),
            phone=f"07{fake.random_number(digits=8, fix_len=True)}",
            id_number=str(fake.unique.random_number(digits=8, fix_len=True)), 
            insurance_type=random.choice(["CASH", "NHIF", "PRIVATE"])
        )
        db.add(pat)
        patients.append(pat)
    db.commit()
    print(f"✅ Registered {len(patients)} Patients.")

    # ==========================================
    # 3. SEED CLINICAL VISITS
    # ==========================================
    print("🔗 Linking Clinical Data...")
    statuses = ["scheduled", "completed", "cancelled"]
    
    for _ in range(50):
        patient = random.choice(patients)
        doctor = random.choice(doctors)
        apt_date = datetime.now() + timedelta(days=random.randint(-30, 7))
        status = random.choice(statuses)
        
        apt = Appointment(
            patient_id=patient.patient_id,
            doctor_id=doctor.doctor_id,
            appointment_date=apt_date,
            status=status,
            notes=fake.sentence(nb_words=6)
        )
        db.add(apt)
        db.flush() 

        if status == "completed":
            record = MedicalRecord(
                patient_id=patient.patient_id,
                doctor_id=doctor.doctor_id,
                appointment_id=apt.appointment_id,
                systolic_bp=random.randint(110, 140),
                diastolic_bp=random.randint(70, 90),
                temperature=round(random.uniform(36.1, 38.5), 1),
                weight_kg=round(random.uniform(50.0, 100.0), 1),
                chief_complaint=fake.sentence(nb_words=4),
                diagnosis_code=f"J{random.randint(10, 99)}.{random.randint(0, 9)}",
                treatment_plan="Prescribed medication."
            )
            db.add(record)
            
            bill = Billing(
                patient_id=patient.patient_id,
                appointment_id=apt.appointment_id,
                total_amount=round(random.uniform(1500.0, 3000.0), 2),
                status="Pending",
                billing_date=apt_date
            )
            db.add(bill)
            db.flush()

            item = InvoiceItem(
                invoice_id=bill.invoice_id,
                description=f"Consultation - Dr. {doctor.last_name}",
                amount=float(bill.total_amount),
                tax_type="E"
            )
            db.add(item)

    db.commit()
    db.close()
    print("⭐ System Saturation Complete. All modules synchronized.")

if __name__ == "__main__":
    seed_data()