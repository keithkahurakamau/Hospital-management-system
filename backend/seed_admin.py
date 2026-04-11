from app.config.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def seed_database():
    # 1. Open a direct connection to the database
    db = SessionLocal()
    
    try:
        admin_email = "admin@medicare.io"
        
        # 2. Check if the admin already exists so we don't create duplicates
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            print(f"✅ Admin account ({admin_email}) already exists in the database.")
            return

        print("⏳ Generating secure hash for Admin password...")
        
        # 3. Create the User object
        # We use get_password_hash to ensure it matches the bcrypt verification in auth.py
        admin_user = User(
            full_name="System Administrator",
            email=admin_email,
            hashed_password=get_password_hash("Admin@2026!"), # Strong test password
            role="ADMIN", 
            is_active=True
        )

        # 4. Save to database
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("🎉 SUCCESS! Database seeded.")
        print("-" * 30)
        print("👤 Role: ADMIN")
        print(f"📧 Email: {admin_email}")
        print("🔑 Password: Admin@2026!")
        print("-" * 30)

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        # Always close the connection
        db.close()

if __name__ == "__main__":
    print("Initiating Medicare ERP Seed Protocol...")
    seed_database()