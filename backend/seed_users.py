import os
import sys
from sqlalchemy.orm import Session
from app.config.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import get_password_hash

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_test_users():
    db = SessionLocal()
    
    # 1. Clear out old users to avoid duplicates
    db.query(User).delete()
    
    # 2. Define our test squad
    test_users = [
        {"email": "admin@medicare.io", "full_name": "System Administrator", "role": "ADMIN", "password": "password"},
        {"email": "doctor@medicare.io", "full_name": "Dr. Sarah Smith", "role": "DOCTOR", "password": "password"},
        {"email": "desk@medicare.io", "full_name": "John Frontdesk", "role": "RECEPTIONIST", "password": "password"},
        {"email": "lab@medicare.io", "full_name": "Mike LabTech", "role": "LAB_TECH", "password": "password"},
        {"email": "pharmacy@medicare.io", "full_name": "Emma Pharmacist", "role": "PHARMACIST", "password": "password"},
    ]

    # 3. Hash passwords and add to DB
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
    db.close()
    print("✅ Database successfully seeded with 5 test accounts!")
    print("All passwords are set to: 'password'")

if __name__ == "__main__":
    seed_test_users()