from sqlalchemy.orm import Session
from app.config.database import SessionLocal

# --- CRITICAL: Import ALL models to register relationships ---
from app.models.user import User
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord
from app.models.pharmacy import DrugInventory, DispenseLog 
# -------------------------------------------------------------

def seed_pharmacy():
    print("💊 Seeding Pharmacy Inventory...")
    db = SessionLocal()

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
        db.add(DrugInventory(**drug_data))

    try:
        db.commit()
        print("✅ Pharmacy inventory successfully seeded!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding pharmacy: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_pharmacy()