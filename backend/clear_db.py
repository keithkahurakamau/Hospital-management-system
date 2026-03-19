from sqlalchemy import text
from app.config.database import SessionLocal, engine, Base

def purge_database():
    print("Initiating global data purge...")
    
    # Verify metadata linkage
    Base.metadata.reflect(bind=engine)
    
    db = SessionLocal()
    
    # Target relations explicitly defined in the architectural schema
    target_tables = [
        "lab_tests",
        "medical_records", 
        "appointments",
        "beds",
        "pharmacy_inventory",
        "patients",
        "doctors"
    ]
    
    try:
        for table in target_tables:
            # CASCADE drops dependent rows automatically.
            # RESTART IDENTITY normalizes all ID sequences to 1.
            query = text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;")
            db.execute(query)
            
        db.commit()
        print("Purge complete. All relational structures truncated and identity sequences reset.")
        
    except Exception as error:
        db.rollback()
        print(f"Critical execution failure during truncation: {error}")
    finally:
        db.close()

if __name__ == "__main__":
    purge_database()