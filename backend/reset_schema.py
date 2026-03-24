from sqlalchemy import text
from app.config.database import engine, Base

# Import ALL models so SQLAlchemy knows how to rebuild them
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.bed import Bed
from app.models.laboratory import LabTest
from app.models.billing import Billing, InvoiceItem
from app.models.medical_record import MedicalRecord  
from app.models.queue import PatientQueue
from app.models.idempotency import IdempotencyKey

# --- NEW INVENTORY & PHARMACY MODELS ---
from app.models.inventory import Location, InventoryItem, StockBatch
from app.models.pharmacy import DispenseLog

def reset_database_schema():
    print("Initiating forceful schema teardown...")
    
    # 1. Forcefully drop and recreate the entire public schema (bypasses all constraint errors)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
    
    print("Rebuilding schema with updated entity attributes...")
    
    # 2. Rebuild the tables with the new Real-World fields (eTIMS, Vitals, Inventory, etc.)
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database schema successfully synchronized.")

if __name__ == "__main__":
    reset_database_schema()