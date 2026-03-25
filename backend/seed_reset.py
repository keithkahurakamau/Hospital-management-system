import sys
import os
from sqlalchemy import text # Important for raw SQL

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User

def reset_database():
    print("⚠️  WARNING: This will FORCE DELETE all tables and constraints.")
    confirm = input("Are you absolutely sure? (y/n): ")
    
    if confirm.lower() != 'y':
        print("Reset aborted.")
        return

    print("\n--- Phase 1: Nuclear Wipe (CASCADE) ---")
    
    with engine.connect() as conn:
        # This bypasses the Jenga problem by dropping the entire public schema
        # and recreating it instantly.
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.commit()
        print("✅ Database schema wiped clean.")

    # Now we use SQLAlchemy to build the fresh tables
    print("\n--- Phase 2: Rebuilding Tables ---")
    Base.metadata.create_all(bind=engine)
    print("✅ Fresh table schema created.")

    print("\n--- Phase 3: Seeding Core Staff ---")
    db = SessionLocal()
    try:
        test_users = [
            {"email": "admin@medicare.io", "full_name": "System Administrator", "role": "ADMIN", "password": "password"},
            {"email": "doctor@medicare.io", "full_name": "Dr. Sarah Smith", "role": "DOCTOR", "password": "password"},
            {"email": "desk@medicare.io", "full_name": "John Frontdesk", "role": "RECEPTIONIST", "password": "password"},
            {"email": "lab@medicare.io", "full_name": "Mike LabTech", "role": "LAB_TECH", "password": "password"},
            {"email": "pharmacy@medicare.io", "full_name": "Emma Pharmacist", "role": "PHARMACIST", "password": "password"},
        ]

        for u in test_users:
            user = User(
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                hashed_password=get_password_hash(u["password"]),
                is_active=True
            )
            db.add(user)
        
        db.commit()
        print(f"✅ Successfully seeded {len(test_users)} core staff members.")
        print("👉 Access restored. Password is 'password'.")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()