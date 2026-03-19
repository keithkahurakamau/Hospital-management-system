from sqlalchemy.orm import Session
from app.config.database import SessionLocal, engine, Base
from app.models.bed import Bed
from app.models.patient import Patient

def seed_beds():
    print("🛏️ Initializing Hospital Infrastructure...")
    
    # 1. Verify table exists
    Base.metadata.create_all(bind=engine)
    print("✅ Schema verified.")

    db = SessionLocal()

    # 2. Clear any partial data from our previous failed run
    if db.query(Bed).count() > 0:
        print("🧹 Clearing partial data from previous run...")
        db.query(Bed).delete()
        db.commit()

    # 3. Define the layout with EXPLICIT unique prefixes to avoid conflicts
    wards = {
        "Intensive Care Unit (ICU)": {"prefix": "ICU", "count": 8},
        "General Ward A": {"prefix": "GNA", "count": 12},
        "General Ward B": {"prefix": "GNB", "count": 12},
        "Maternity Ward": {"prefix": "MAT", "count": 10},
        "Pediatrics": {"prefix": "PED", "count": 8}
    }

    # 4. Generate the beds
    for ward_name, config in wards.items():
        for i in range(1, config["count"] + 1):
            bed_num = f"{config['prefix']}-{str(i).zfill(2)}"
            
            bed = Bed(ward_name=ward_name, bed_number=bed_num)
            db.add(bed)

    db.commit()
    db.close()
    print("✅ Physical infrastructure provisioned successfully.")

if __name__ == "__main__":
    seed_beds()