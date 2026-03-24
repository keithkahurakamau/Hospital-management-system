from sqlalchemy.orm import Session
from app.config.database import SessionLocal, engine, Base
# IMPORTANT: We must import the User model so SQLAlchemy knows it exists
from app.models.user import User 
from passlib.context import CryptContext

# Security configuration
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__ident="2b", deprecated="auto")

def seed_users():
    print("🚀 Initializing Database for Medicare ERP...")
    
    # This line is the magic fix: It creates the tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    print("🧹 Clearing existing users to apply branding corrections...")
    try:
        # We use a direct execute to handle cases where the table might be empty
        db.query(User).delete()
        db.commit()
    except Exception as e:
        print(f"ℹ️ Note: Clean slate skip (Table was likely empty): {e}")
        db.rollback()

    print("🔐 Hashing passwords and seeding accounts...")
    
    doctor = User(
        email="doctor@medicare.io",
        full_name="Dr. Keith Kamau",
        hashed_password=pwd_context.hash("admin123"),
        role="DOCTOR",
        is_active=True
    )

    secretary = User(
        email="desk@medicare.io",
        full_name="Front Desk Secretary",
        hashed_password=pwd_context.hash("desk123"),
        role="SECRETARY",
        is_active=True
    )

    try:
        db.add_all([doctor, secretary])
        db.commit()
        print("✅ Users successfully synchronized to @medicare.io!")
    except Exception as e:
        print(f"❌ Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()