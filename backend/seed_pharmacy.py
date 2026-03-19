import random
from sqlalchemy.orm import Session
from app.config.database import SessionLocal
from app.models.pharmacy import Drug

def seed_pharmacy():
    db = SessionLocal()
    print("📦 Initializing Pharmacy Logistics...")

    # Check if inventory already exists to prevent duplicate SKUs
    if db.query(Drug).count() > 0:
        print("⚠️ Pharmacy is already stocked. Clearing old inventory...")
        db.query(Drug).delete()
        db.commit()

    medications = [
        {"name": "Amoxicillin 500mg", "cat": "Antibiotic", "price": 12.50},
        {"name": "Ibuprofen 400mg", "cat": "Pain Relief", "price": 5.99},
        {"name": "Lisinopril 10mg", "cat": "Cardiovascular", "price": 15.00},
        {"name": "Metformin 850mg", "cat": "Antidiabetic", "price": 8.45},
        {"name": "Atorvastatin 20mg", "cat": "Cholesterol", "price": 22.10},
        {"name": "Azithromycin 250mg", "cat": "Antibiotic", "price": 18.75},
        {"name": "Amlodipine 5mg", "cat": "Cardiovascular", "price": 11.20},
        {"name": "Albuterol Inhaler", "cat": "Respiratory", "price": 45.00},
        {"name": "Omeprazole 20mg", "cat": "Gastrointestinal", "price": 14.30},
        {"name": "Losartan 50mg", "cat": "Cardiovascular", "price": 16.80},
        {"name": "Gabapentin 300mg", "cat": "Neurological", "price": 24.50},
        {"name": "Hydrochlorothiazide", "cat": "Diuretic", "price": 6.75},
        {"name": "Sertraline 50mg", "cat": "Antidepressant", "price": 19.99},
        {"name": "Simvastatin 40mg", "cat": "Cholesterol", "price": 13.50},
        {"name": "Montelukast 10mg", "cat": "Respiratory", "price": 28.00},
        {"name": "Acetaminophen 500mg", "cat": "Pain Relief", "price": 4.50},
        {"name": "Pantoprazole 40mg", "cat": "Gastrointestinal", "price": 17.25},
        {"name": "Escitalopram 10mg", "cat": "Antidepressant", "price": 21.00},
        {"name": "Fluconazole 150mg", "cat": "Antifungal", "price": 9.80},
        {"name": "Cephalexin 500mg", "cat": "Antibiotic", "price": 15.60},
    ]

    for i, med in enumerate(medications):
        # Generate random stock to trigger UI alerts
        # 10% chance of being out of stock, 20% low stock, 70% well stocked
        rand_val = random.random()
        if rand_val < 0.10:
            stock = 0
        elif rand_val < 0.30:
            stock = random.randint(1, 15)
        else:
            stock = random.randint(40, 200)

        drug = Drug(
            name=med["name"],
            sku=f"MED-{str(i+1).zfill(4)}",
            category=med["cat"],
            stock_quantity=stock,
            reorder_level=20,
            unit_price=med["price"]
        )
        db.add(drug)

    db.commit()
    db.close()
    print("✅ Pharmacy stocked with 20 essential medications.")

if __name__ == "__main__":
    seed_pharmacy()