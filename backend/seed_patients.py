import sys
import os
from datetime import date

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.database import SessionLocal
from app.models.patient import Patient

def seed_patients():
    db = SessionLocal()
    
    # Realistic Kenyan Patient Data with all required fields
    test_patients = [
        {
            "outpatient_no": "OPD-001", "surname": "Kamau", "other_names": "John Njoroge", "sex": "Male", 
            "date_of_birth": date(1985, 5, 12), "id_type": "National ID", "id_number": "22334455", 
            "nationality": "Kenyan", "telephone_1": "0711222333", "residence": "Pangani", "town": "Nairobi", 
            "occupation": "Civil Engineer", "nok_name": "Mary Kamau", "nok_relationship": "Spouse", "nok_contact": "0722333444"
        },
        {
            "outpatient_no": "OPD-002", "surname": "Ochieng", "other_names": "Sarah Achieng", "sex": "Female", 
            "date_of_birth": date(1992, 11, 24), "id_type": "National ID", "id_number": "33445566", 
            "nationality": "Kenyan", "telephone_1": "0733444555", "residence": "Milimani", "town": "Kisumu", 
            "occupation": "Banker", "nok_name": "Peter Ochieng", "nok_relationship": "Brother", "nok_contact": "0712345678"
        },
        {
            "outpatient_no": "OPD-003", "surname": "Musa", "other_names": "Fatima", "sex": "Female", 
            "date_of_birth": date(1978, 2, 15), "id_type": "Passport", "id_number": "A1234567", 
            "nationality": "Kenyan", "telephone_1": "0700111222", "residence": "Old Town", "town": "Mombasa", 
            "occupation": "Merchant", "nok_name": "Hassan Musa", "nok_relationship": "Husband", "nok_contact": "0799888777"
        },
        {
            "outpatient_no": "OPD-004", "surname": "Wekesa", "other_names": "Emmanuel", "sex": "Male", 
            "date_of_birth": date(2005, 8, 30), "id_type": "Birth Certificate", "id_number": "BC-7890", 
            "nationality": "Kenyan", "telephone_1": "0755666777", "residence": "Kanduyi", "town": "Bungoma", 
            "occupation": "Student", "nok_name": "James Wekesa", "nok_relationship": "Father", "nok_contact": "0744333222"
        },
        {
            "outpatient_no": "OPD-005", "surname": "Cheruiyot", "other_names": "Mercy Jepkosgei", "sex": "Female", 
            "date_of_birth": date(1990, 4, 3), "id_type": "National ID", "id_number": "44556677", 
            "nationality": "Kenyan", "telephone_1": "0788999000", "residence": "Kapkugerwet", "town": "Kericho", 
            "occupation": "Teacher", "nok_name": "David Korir", "nok_relationship": "Spouse", "nok_contact": "0711000999"
        },
        {
            "outpatient_no": "OPD-006", "surname": "Mutua", "other_names": "Kevin", "sex": "Male", 
            "date_of_birth": date(1965, 12, 12), "id_type": "National ID", "id_number": "11223344", 
            "nationality": "Kenyan", "telephone_1": "0721456789", "residence": "Mumbuni", "town": "Machakos", 
            "occupation": "Farmer", "nok_name": "Alice Mutua", "nok_relationship": "Daughter", "nok_contact": "0720111222"
        },
        {
            "outpatient_no": "OPD-007", "surname": "Hassan", "other_names": "Ahmed Bakari", "sex": "Male", 
            "date_of_birth": date(1988, 7, 7), "id_type": "National ID", "id_number": "55667788", 
            "nationality": "Kenyan", "telephone_1": "0712777888", "residence": "Bull Camp", "town": "Garissa", 
            "occupation": "Veterinarian", "nok_name": "Umar Hassan", "nok_relationship": "Brother", "nok_contact": "0733555444"
        },
        {
            "outpatient_no": "OPD-008", "surname": "Nyongesa", "other_names": "Beryl", "sex": "Female", 
            "date_of_birth": date(1998, 1, 20), "id_type": "National ID", "id_number": "66778899", 
            "nationality": "Kenyan", "telephone_1": "0766123456", "residence": "Amagoro", "town": "Busia", 
            "occupation": "Nurse", "nok_name": "Samuel Nyongesa", "nok_relationship": "Father", "nok_contact": "0722111000"
        },
        {
            "outpatient_no": "OPD-009", "surname": "Mulu", "other_names": "Catherine", "sex": "Female", 
            "date_of_birth": date(1950, 6, 18), "id_type": "National ID", "id_number": "77889900", 
            "nationality": "Kenyan", "telephone_1": "0708654321", "residence": "Kileleshwa", "town": "Nairobi", 
            "occupation": "Retired", "nok_name": "Brian Mulu", "nok_relationship": "Son", "nok_contact": "0710101010"
        },
        {
            "outpatient_no": "OPD-010", "surname": "Kiprono", "other_names": "Elias", "sex": "Male", 
            "date_of_birth": date(1980, 9, 25), "id_type": "National ID", "id_number": "88990011", 
            "nationality": "Kenyan", "telephone_1": "0725252525", "residence": "Langas", "town": "Eldoret", 
            "occupation": "Architect", "nok_name": "Faith Kiprono", "nok_relationship": "Spouse", "nok_contact": "0730303030"
        }
    ]

    try:
        print("🌱 Seeding Outpatient Records...")
        for p_data in test_patients:
            # Check by OPD number to prevent duplicates
            exists = db.query(Patient).filter(Patient.outpatient_no == p_data["outpatient_no"]).first()
            if not exists:
                patient = Patient(**p_data)
                db.add(patient)
        
        db.commit()
        print(f"✅ Successfully seeded {len(test_patients)} outpatients.")
    except Exception as e:
        print(f"❌ Error during patient seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_patients()