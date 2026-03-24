from sqlalchemy.orm import Session
from app.config.database import SessionLocal, engine, Base

# --- CRITICAL: Import these so SQLAlchemy can resolve relationships ---
from app.models.user import User
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.pharmacy import DrugInventory, DispenseLog 
# ----------------------------------------------------------------------

def seed_pharmacy():
    print("💊 Initializing Pharmacy Inventory for Medicare ERP...")
    
    # This ensures all tables (including patients/users) exist before seeding
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    print("🧹 Clearing old inventory data...")
    try:
        # Clearing DrugInventory first. 
        # Note: If you have existing logs, you might need to clear DispenseLog too
        db.query(DispenseLog).delete()
        db.query(DrugInventory).delete()
        db.commit()
    except Exception as e:
        print(f"ℹ️ Cleanup info: {e}")
        db.rollback()

    drugs = [
        {
            "brand_name": "Amoxyl 500mg",
            "generic_name": "Amoxicillin",
            "category": "Antibiotic",
            "unit_price": 15.0,
            "stock_quantity": 500,
            "requires_prescription": True
        },
        {
            "brand_name": "Augmentin 625mg",
            "generic_name": "Amoxicillin + Clavulanic Acid",
            "category": "Antibiotic",
            "unit_price": 120.0,
            "stock_quantity": 100,
            "requires_prescription": True
        },
        {
            "brand_name": "Panadol 500mg",
            "generic_name": "Paracetamol",
            "category": "Analgesic",
            "unit_price": 5.0,
            "stock_quantity": 1000,
            "requires_prescription": False
        },
        {
            "brand_name": "Mara-Moja",
            "generic_name": "Paracetamol + Aspirin + Caffeine",
            "category": "Analgesic",
            "unit_price": 10.0,
            "stock_quantity": 800,
            "requires_prescription": False
        },
        {
            "brand_name": "Coartem 80/480",
            "generic_name": "Artemether + Lumefantrine",
            "category": "Antimalarial",
            "unit_price": 600.0,
            "stock_quantity": 50,
            "requires_prescription": True
        },
        {
            "brand_name": "Glucophage 500mg",
            "generic_name": "Metformin",
            "category": "Antidiabetic",
            "unit_price": 25.0,
            "stock_quantity": 300,
            "requires_prescription": True
        }
    ]

    print("📦 Stocking shelves with essential medications...")
    for drug_data in drugs:
        drug = DrugInventory(**drug_data)
        db.add(drug)

    try:
        db.commit()
        print("✅ Pharmacy inventory successfully seeded!")
    except Exception as e:
        print(f"❌ Error seeding pharmacy: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_pharmacy()