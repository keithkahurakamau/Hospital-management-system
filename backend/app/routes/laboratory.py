from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from app.config.database import get_db
from app.models.laboratory import LabTest, LabTestCatalog, LabTestRequiredItem
from app.models.inventory import StockBatch, InventoryUsageLog
from app.models.patient import Patient

router = APIRouter(prefix="/api/lab", tags=["Laboratory"])

# --- SCHEMAS ---
class TestRequest(BaseModel):
    patient_id: int
    doctor_id: int = 1 # Defaulting to 1 for prototyping
    catalog_id: int    # NEW: Link directly to the master catalog

class TestResultUpdate(BaseModel):
    result_summary: str
    lab_tech_user_id: int = 1 # Defaulting to 1 for prototyping; hook this up to JWT auth later

class BloodGroupUpdate(BaseModel):
    blood_group: str

# --- ENDPOINTS ---

@router.get("/")
def get_all_tests(db: Session = Depends(get_db)):
    """Retrieves all lab tests, joining patient, doctor, and catalog data for the UI."""
    tests = db.query(LabTest).options(
        joinedload(LabTest.patient),
        joinedload(LabTest.doctor),
        joinedload(LabTest.catalog_item)
    ).order_by(LabTest.status.desc(), LabTest.requested_at.desc()).all() # Pending first
    
    return [
        {
            "test_id": t.test_id,
            "patient_name": f"{t.patient.surname}, {t.patient.other_names}", # Fixed naming
            "patient_id": t.patient_id,
            "blood_group": t.patient.blood_group or "Unknown",
            "doctor_name": f"Dr. {t.doctor.last_name}" if t.doctor else "Unknown",
            "test_name": t.catalog_item.test_name if t.catalog_item else t.test_name,
            "status": t.status,
            "result_summary": t.result_summary,
            "date": t.requested_at.strftime("%b %d, %Y - %H:%M")
        } for t in tests
    ]

@router.patch("/patient/{patient_id}/blood-group")
def update_blood_group(patient_id: int, data: BloodGroupUpdate, db: Session = Depends(get_db)):
    """Allows Lab Tech to update the patient's master blood group record."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    
    patient.blood_group = data.blood_group
    db.commit()
    return {"message": "Blood group updated successfully", "blood_group": patient.blood_group}


@router.post("/request", status_code=status.HTTP_201_CREATED)
def request_lab_test(req: TestRequest, db: Session = Depends(get_db)):
    """Allows a doctor to order a new lab test from the catalog."""
    
    # 1. Fetch the master catalog item to lock in pricing and name
    catalog_item = db.query(LabTestCatalog).filter(LabTestCatalog.catalog_id == req.catalog_id).first()
    if not catalog_item:
        raise HTTPException(status_code=404, detail="Lab test catalog item not found")
        
    # 2. Create the test request
    new_test = LabTest(
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        catalog_id=catalog_item.catalog_id,
        test_name=catalog_item.test_name,
        billed_price=catalog_item.base_price, # Locks in the price for the cashier!
        status="Pending"
    )
    db.add(new_test)
    db.commit()
    return {"message": "Lab test requested successfully"}


@router.patch("/{test_id}/complete")
def complete_test(test_id: int, update: TestResultUpdate, db: Session = Depends(get_db)):
    """Allows lab technicians to input results, marks the test as Completed, and deducts inventory."""
    test = db.query(LabTest).filter(LabTest.test_id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    if test.status == "Completed":
        raise HTTPException(status_code=400, detail="This test is already completed.")
    
    # 1. Update Clinical Data
    test.status = "Completed"
    test.result_summary = update.result_summary
    test.completed_at = datetime.now(timezone.utc)
    test.performed_by_id = update.lab_tech_user_id

    # 2. Automated Inventory Deduction (Smart FEFO Routing)
    if test.catalog_id:
        required_items = db.query(LabTestRequiredItem).filter(
            LabTestRequiredItem.catalog_id == test.catalog_id
        ).all()

        for req in required_items:
            qty_needed = req.quantity_required
            
            # Find batches with stock, expiring soonest (FEFO)
            batches = db.query(StockBatch).filter(
                StockBatch.item_id == req.inventory_item_id,
                StockBatch.quantity > 0
            ).order_by(StockBatch.expiry_date.asc()).all()

            for batch in batches:
                if qty_needed <= 0:
                    break # We have fulfilled the requirement for this item
                
                # Deduct from this batch
                deduct_amount = min(batch.quantity, qty_needed)
                batch.quantity -= deduct_amount
                qty_needed -= deduct_amount
                
                # Log the usage for the Admin audit trail
                usage_log = InventoryUsageLog(
                    item_id=req.inventory_item_id,
                    item_name=req.item_name,
                    quantity_used=deduct_amount,
                    department="Laboratory",
                    used_by_user_id=update.lab_tech_user_id,
                    reference_type="LabTest",
                    reference_id=test.test_id
                )
                db.add(usage_log)

            if qty_needed > 0:
                # Warning if we ran out of stock entirely during the deduction
                print(f"WARNING: Inventory deficit for '{req.item_name}'. Missing {qty_needed} units.")

    db.commit()
    return {"message": "Results saved and inventory successfully deducted."}