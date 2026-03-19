import random
from datetime import datetime, timedelta, timezone
from app.config.database import SessionLocal, engine, Base
from app.models.laboratory import LabTest
from app.models.patient import Patient
from app.models.doctor import Doctor

def seed_lab_tests():
    print("🔬 Initializing Laboratory Subsystem...")

    # 1. Verify schema and create table if it doesn't exist
    Base.metadata.create_all(bind=engine)
    print("✅ Schema verified.")

    db = SessionLocal()

    # 2. Clear old test data if running multiple times
    if db.query(LabTest).count() > 0:
        print("🧹 Clearing previous laboratory records...")
        db.query(LabTest).delete()
        db.commit()

    # 3. Fetch dependencies (Foreign Keys)
    patients = db.query(Patient).all()
    doctors = db.query(Doctor).all()

    if not patients or not doctors:
        print("❌ Error: Registry empty. Run seed_system.py to populate patients and doctors first.")
        db.close()
        return

    # Mock Data Categories
    test_types = [
        "Complete Blood Count (CBC)",
        "Basic Metabolic Panel (BMP)",
        "Lipid Panel",
        "Urinalysis",
        "MRI Scan"
    ]

    mock_results = {
        "Complete Blood Count (CBC)": "WBC 7.5 K/uL, RBC 4.8 M/uL, Hemoglobin 14.2 g/dL. All hematological counts are well within standard reference ranges.",
        "Basic Metabolic Panel (BMP)": "Glucose 92 mg/dL, Calcium 9.4 mg/dL, Sodium 140 mEq/L, Potassium 4.1 mEq/L. Renal function and electrolytes normal.",
        "Lipid Panel": "Total Cholesterol 185 mg/dL, HDL 55 mg/dL, LDL 110 mg/dL. Optimal cardiovascular lipid profile.",
        "Urinalysis": "Color: Yellow, Clarity: Clear, pH: 6.0, Specific Gravity: 1.015. Negative for protein, glucose, leukocytes, and ketones.",
        "MRI Scan": "No acute intracranial abnormality. Ventricles and sulci are age-appropriate. No mass effect, midline shift, or restricted diffusion."
    }

    print("🧪 Processing test batches...")
    
    # 4. Generate 20 random lab tests
    for _ in range(20):
        test_name = random.choice(test_types)
        
        # 40% Pending, 60% Completed
        is_completed = random.random() > 0.4 
        
        # Requested randomly in the last 7 days
        requested = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 7), hours=random.randint(1, 23))

        lab_test = LabTest(
            patient_id=random.choice(patients).patient_id,
            doctor_id=random.choice(doctors).doctor_id,
            test_name=test_name,
            requested_at=requested
        )

        if is_completed:
            lab_test.status = "Completed"
            lab_test.result_summary = mock_results[test_name]
            # Completed a few hours after the request
            lab_test.completed_at = requested + timedelta(hours=random.randint(2, 48))

        db.add(lab_test)

    db.commit()
    db.close()
    print("✅ Laboratory seeded with 20 test requests and clinical findings.")

if __name__ == "__main__":
    seed_lab_tests()