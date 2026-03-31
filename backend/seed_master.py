import sys
import os
import random
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import text

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.database import SessionLocal, engine, Base
from app.core.security import get_password_hash

# =======================================================================
# --- CRITICAL: Import ALL models so create_all() knows the schema ---
# =======================================================================
from app.models.user import User
from app.models.patient import Patient
from app.models.bed import Bed
from app.models.medical_record import MedicalRecord
from app.models.queue import PatientQueue
from app.models.laboratory import LabTest
from app.models.doctor import Doctor          # <-- Model verified
from app.models.appointment import Appointment
from app.models.billing import Billing
# Assuming your pharmacy model is named DrugInventory based on previous snippets
from app.models.pharmacy import DrugInventory 
# =======================================================================

def seed_master():
    print("\n🚀 STARTING MEDICARE ERP MASTER SEEDER...\n")
    
    # ==========================================
    # PHASE 1: NUCLEAR WIPE & REBUILD
    # ==========================================
    print("⚠️  Initiating forceful schema teardown...")
    with engine.begin() as conn:
        # Bypasses all foreign key locks by dropping the entire public schema
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
    print("🧹 Old schema cleared.")
    
    Base.metadata.create_all(bind=engine)
    print("✅ New database schema built successfully.\n")

    db = SessionLocal()

    try:
        # ==========================================
        # PHASE 2A: SEED USERS (STAFF)
        # ==========================================
        print("👨‍⚕️ Seeding Core Staff Accounts...")
        test_users = [
            {"email": "admin@medicare.io", "full_name": "System Administrator", "role": "ADMIN", "password": "password"},
            {"email": "doctor@medicare.io", "full_name": "Dr. Sarah Smith", "role": "DOCTOR", "password": "password"},
            {"email": "desk@medicare.io", "full_name": "John Frontdesk", "role": "RECEPTIONIST", "password": "password"},
            {"email": "lab@medicare.io", "full_name": "Mike LabTech", "role": "LAB_TECH", "password": "password"},
            {"email": "pharmacy@medicare.io", "full_name": "Emma Pharmacist", "role": "PHARMACIST", "password": "password"},
        ]

        staff_records = []
        for u in test_users:
            user = User(
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                hashed_password=get_password_hash(u["password"]),
                is_active=True
            )
            db.add(user)
            staff_records.append(user)
        db.commit()
        
        # ==========================================
        # PHASE 2B: SEED DOCTORS (CLINICAL STAFF)
        # ==========================================
        print("🩺 Seeding Clinical Doctors Directory...")
        # Since your Doctor model is standalone (no user_id FK), we create it with its specific fields
        clinical_doctor = Doctor(
            first_name="Sarah",
            last_name="Smith",
            specialization="General Medicine",
            phone="0712345678",
            email="doctor@medicare.io", # Matches the login email for consistency, though unlinked
            availability_schedule="Mon-Fri, 8AM-5PM"
        )
        db.add(clinical_doctor)
        db.commit()
        db.refresh(clinical_doctor)

        # ==========================================
        # PHASE 3: SEED PATIENTS
        # ==========================================
        print("🌱 Seeding Patient Registry...")
        patient_data = [
            {"outpatient_no": "OPD-001", "surname": "Kamau", "other_names": "John Njoroge", "sex": "Male", "date_of_birth": date(1985, 5, 12), "id_type": "National ID", "id_number": "22334455", "nationality": "Kenyan", "telephone_1": "0711222333", "residence": "Pangani", "town": "Nairobi", "occupation": "Civil Engineer", "nok_name": "Mary Kamau", "nok_relationship": "Spouse", "nok_contact": "0722333444"},
            {"outpatient_no": "OPD-002", "surname": "Ochieng", "other_names": "Sarah Achieng", "sex": "Female", "date_of_birth": date(1992, 11, 24), "id_type": "National ID", "id_number": "33445566", "nationality": "Kenyan", "telephone_1": "0733444555", "residence": "Milimani", "town": "Kisumu", "occupation": "Banker", "nok_name": "Peter Ochieng", "nok_relationship": "Brother", "nok_contact": "0712345678"},
            {"outpatient_no": "OPD-003", "surname": "Musa", "other_names": "Fatima", "sex": "Female", "date_of_birth": date(1978, 2, 15), "id_type": "Passport", "id_number": "A1234567", "nationality": "Kenyan", "telephone_1": "0700111222", "residence": "Old Town", "town": "Mombasa", "occupation": "Merchant", "nok_name": "Hassan Musa", "nok_relationship": "Husband", "nok_contact": "0799888777"},
            {"outpatient_no": "OPD-004", "surname": "Wekesa", "other_names": "Emmanuel", "sex": "Male", "date_of_birth": date(2005, 8, 30), "id_type": "Birth Certificate", "id_number": "BC-7890", "nationality": "Kenyan", "telephone_1": "0755666777", "residence": "Kanduyi", "town": "Bungoma", "occupation": "Student", "nok_name": "James Wekesa", "nok_relationship": "Father", "nok_contact": "0744333222"},
            {"outpatient_no": "OPD-005", "surname": "Cheruiyot", "other_names": "Mercy Jepkosgei", "sex": "Female", "date_of_birth": date(1990, 4, 3), "id_type": "National ID", "id_number": "44556677", "nationality": "Kenyan", "telephone_1": "0788999000", "residence": "Kapkugerwet", "town": "Kericho", "occupation": "Teacher", "nok_name": "David Korir", "nok_relationship": "Spouse", "nok_contact": "0711000999"}
        ]
        
        inserted_patients = []
        for p in patient_data:
            patient = Patient(**p)
            db.add(patient)
            inserted_patients.append(patient)
        db.commit()

        # ==========================================
        # PHASE 4: SEED BEDS & WARDS
        # ==========================================
        print("🛏️  Initializing Hospital Infrastructure (Beds)...")
        wards = {
            "Intensive Care Unit (ICU)": {"prefix": "ICU", "count": 8},
            "General Ward A": {"prefix": "GNA", "count": 12},
            "Maternity Ward": {"prefix": "MAT", "count": 10},
            "Pediatrics": {"prefix": "PED", "count": 8}
        }
        for ward_name, config in wards.items():
            for i in range(1, config["count"] + 1):
                bed = Bed(ward_name=ward_name, bed_number=f"{config['prefix']}-{str(i).zfill(2)}")
                db.add(bed)
        db.commit()

        # ==========================================
        # PHASE 5: SEED PHARMACY INVENTORY
        # ==========================================
        print("💊 Stocking Pharmacy Shelves...")
        drugs = [
            {"brand_name": "Amoxyl 500mg", "generic_name": "Amoxicillin", "category": "Antibiotic", "unit_price": 15.0, "stock_quantity": 500, "requires_prescription": True},
            {"brand_name": "Augmentin 625mg", "generic_name": "Amoxicillin + Clavulanic Acid", "category": "Antibiotic", "unit_price": 120.0, "stock_quantity": 100, "requires_prescription": True},
            {"brand_name": "Panadol 500mg", "generic_name": "Paracetamol", "category": "Analgesic", "unit_price": 5.0, "stock_quantity": 1000, "requires_prescription": False},
            {"brand_name": "Mara-Moja", "generic_name": "Paracetamol + Aspirin", "category": "Analgesic", "unit_price": 10.0, "stock_quantity": 800, "requires_prescription": False},
            {"brand_name": "Coartem 80/480", "generic_name": "Artemether + Lumefantrine", "category": "Antimalarial", "unit_price": 600.0, "stock_quantity": 50, "requires_prescription": True},
            {"brand_name": "Glucophage 500mg", "generic_name": "Metformin", "category": "Antidiabetic", "unit_price": 25.0, "stock_quantity": 300, "requires_prescription": True}
        ]
        for drug in drugs:
            db.add(DrugInventory(**drug)) 
        db.commit()

        # ==========================================
        # PHASE 6: SEED MEDICAL RECORDS (HISTORY)
        # ==========================================
        print("🩺 Generating Medical History & Clinical Notes...")
        clinical_scenarios = [
            {"chief_complaint": "Severe headache, joint pains, and fever for 3 days.", "diagnosis": "B50 - Plasmodium Falciparum Malaria", "treatment_plan": "Rapid diagnostic test (RDT) positive. Advised bed rest.", "prescription_notes": "AL 80/480mg BD x 3 days\nParacetamol 500mg TDS x 5 days"},
            {"chief_complaint": "Dry cough, sore throat, and mild fever.", "diagnosis": "J06 - Acute Upper Respiratory Infections (URTI)", "treatment_plan": "Throat appears inflamed. Viral etiology suspected.", "prescription_notes": "Cetirizine 100mg OD x 5 days\nWarm saline gargles"},
            {"chief_complaint": "Lower abdominal pain and painful urination.", "diagnosis": "N39 - Urinary Tract Infection (UTI)", "treatment_plan": "Suprapubic tenderness noted. Urinalysis confirms leukocytes.", "prescription_notes": "Ciprofloxacin 500mg BD x 5 days"},
            {"chief_complaint": "Routine follow-up for high blood pressure.", "diagnosis": "I10 - Essential (Primary) Hypertension", "treatment_plan": "BP slightly elevated. Advised to reduce salt intake.", "prescription_notes": "Amlodipine 5mg OD x 30 days"}
        ]
        
        for patient in inserted_patients:
            for _ in range(random.randint(1, 3)):
                scenario = random.choice(clinical_scenarios)
                visit_date = datetime.now(timezone.utc) - timedelta(days=random.randint(5, 365))
                record = MedicalRecord(
                    patient_id=patient.patient_id,
                    # UPDATED: Uses the ID generated by the Doctor table, not the User table
                    doctor_id=clinical_doctor.doctor_id, 
                    chief_complaint=scenario["chief_complaint"],
                    diagnosis=scenario["diagnosis"],
                    treatment_plan=scenario["treatment_plan"],
                    prescription_notes=scenario["prescription_notes"],
                    systolic_bp=random.randint(110, 150),
                    diastolic_bp=random.randint(70, 95),
                    temperature=round(random.uniform(36.5, 38.5), 1),
                    weight_kg=round(random.uniform(60.0, 90.0), 1),
                    created_at=visit_date
                )
                db.add(record)
        db.commit()

        # ==========================================
        # PHASE 7: SEED LAB TESTS
        # ==========================================
        print("🔬 Generating Laboratory Test Results...")
        test_types = ["Complete Blood Count (CBC)", "Basic Metabolic Panel (BMP)", "Lipid Panel", "Urinalysis", "Malaria RDT"]
        
        for _ in range(15):
            test_name = random.choice(test_types)
            is_completed = random.random() > 0.3 
            requested = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 14), hours=random.randint(1, 23))

            lab_test = LabTest(
                patient_id=random.choice(inserted_patients).patient_id,
                doctor_id=clinical_doctor.doctor_id, # LabTest uses doctors.doctor_id
                test_name=test_name,
                requested_at=requested
            )
            
            if is_completed:
                lab_test.status = "Completed"
                lab_test.result_summary = "Test analyzed successfully. Values within standard reference range."
                lab_test.completed_at = requested + timedelta(hours=random.randint(2, 24))
            db.add(lab_test)
        db.commit()

        # ==========================================
        # PHASE 8: SEED ACTIVE LIVE QUEUE
        # ==========================================
        print("🚦 Activating Live Department Queues...")
        active_queues = [
            {"patient_id": inserted_patients[0].patient_id, "department": "Consultation", "acuity_level": 2, "status": "Waiting"},
            {"patient_id": inserted_patients[1].patient_id, "department": "Laboratory", "acuity_level": 3, "status": "Waiting"},
            {"patient_id": inserted_patients[2].patient_id, "department": "Pharmacy", "acuity_level": 3, "status": "Waiting", "notes": "Amoxil 500mg"},
            {"patient_id": inserted_patients[3].patient_id, "department": "Consultation", "acuity_level": 1, "status": "In Progress"}
        ]
        for q in active_queues:
            db.add(PatientQueue(**q))
        db.commit()

        print("\n🎉 FULL SYSTEM SEEDED SUCCESSFULLY!")
        print("You can now safely login and test the application end-to-end.")
        print("--------------------------------------------------")
        print("Admin Login:  admin@medicare.io    / password")
        print("Doctor Login: doctor@medicare.io   / password")
        print("--------------------------------------------------\n")

    except Exception as e:
        print(f"\n❌ SEEDING FAILED: Rolling back changes...\nError: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_master()