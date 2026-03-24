from app.config.database import engine
from app.models.pharmacy import DispenseLog

def fix_schema():
    print("🛠️  Dropping outdated dispense_logs table...")
    try:
        # This deletes the table and its outdated schema
        DispenseLog.__table__.drop(engine, checkfirst=True)
        print("✅ Table dropped successfully!")
        print("🔄 Please restart your FastAPI (Uvicorn) server to rebuild it with the new 'drug_id' column.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_schema()