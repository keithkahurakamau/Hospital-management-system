import os
from sqlalchemy import MetaData
from app.config.database import engine, Base

# --- Import ALL models so create_all() knows exactly what to build ---
from app.models.user import User
from app.models.patient import Patient
from app.models.pharmacy import DrugInventory, DispenseLog
from app.models.medical_record import MedicalRecord
from app.models.queue import PatientQueue
from app.models.appointment import Appointment
from app.models.bed import Bed
from app.models.billing import Billing
from app.models.laboratory import LabTest
from app.models.doctor import Doctor
# ---------------------------------------------------------------------

def reset_database():
    print("⚠️  WARNING: Resetting entire database schema...")
    
    # 1. Reflect current database state (finds all tables and foreign keys)
    meta = MetaData()
    meta.reflect(bind=engine)
    
    # 2. Drop all tables in the correct order (respecting foreign keys)
    meta.drop_all(bind=engine)
    print("🧹 Old schema cleared.")
    
    # 3. Create all tables fresh based on imported models
    Base.metadata.create_all(bind=engine)
    print("✅ New database schema built successfully.")

def run_seeders():
    print("\n🚀 Starting Master Seeder for Medicare ERP...\n")
    
    reset_database()

    # Run seeders in dependency order
    print("\n👤 Executing User Seeder...")
    os.system("python3 seed_users.py")
    
    print("\n🏥 Executing Patient Seeder...")
    os.system("python3 seed_patients.py")
    
    print("\n💊 Executing Pharmacy Seeder...")
    os.system("python3 seed_pharmacy.py")
    
    print("\n🎉 All modules seeded successfully! The system is ready for E2E testing.")

if __name__ == "__main__":
    run_seeders()