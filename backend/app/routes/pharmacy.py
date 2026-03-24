import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.config.database import get_db
from app.models.pharmacy import DrugInventory, DispenseLog
from app.models.medical_record import MedicalRecord
from app.models.patient import Patient
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/api/pharmacy", tags=["Pharmacy POS"])

# --- DTOs (Data Transfer Objects) ---
class CartItem(BaseModel):
    drug_id: int
    quantity: int

class DispenseRequest(BaseModel):
    patient_id: Optional[int] = None
    record_id: Optional[int] = None
    payment_method: str
    cart: List[CartItem]

# --- ENDPOINTS ---
@router.get("/inventory")
def get_inventory(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Fetches all available drugs for the POS lookup."""
    return db.query(DrugInventory).filter(DrugInventory.stock_quantity > 0).order_by(DrugInventory.brand_name).all()

@router.get("/pending-prescriptions")
def get_pending_prescriptions(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Fetches patients from the last 24 hours who have a prescription note."""
    twenty_four_hours_ago = datetime.now() - timedelta(days=1)
    
    results = db.query(MedicalRecord, Patient).join(
        Patient, MedicalRecord.patient_id == Patient.patient_id
    ).filter(
        MedicalRecord.prescription_notes != None,
        MedicalRecord.prescription_notes != "",
        MedicalRecord.created_at >= twenty_four_hours_ago
    ).order_by(desc(MedicalRecord.created_at)).all()

    return [
        {
            "record_id": record.record_id,
            "patient_id": patient.patient_id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "outpatient_no": patient.outpatient_no,
            "prescription_notes": record.prescription_notes,
            "time_prescribed": record.created_at
        } for record, patient in results
    ]

@router.post("/dispense")
def dispense_drugs(request: DispenseRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Executes the POS transaction safely and exposes detailed errors."""
    try:
        total_billed = 0.0
        
        # Get the actual user ID of the staff member operating the POS from the JWT
        user = db.query(User).filter(User.email == current_user.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid user session")

        # CRITICAL FIX: Safely extract the primary key (whether it is named 'user_id' or just 'id')
        staff_id = getattr(user, 'user_id', getattr(user, 'id', None))
        if not staff_id:
            raise ValueError("Could not extract primary key from User model.")

        for item in request.cart:
            drug = db.query(DrugInventory).filter(DrugInventory.drug_id == item.drug_id).first()
            if not drug:
                raise HTTPException(status_code=404, detail=f"Drug ID {item.drug_id} not found.")
            if drug.stock_quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {drug.brand_name}.")

            # 1. Deduct Stock
            drug.stock_quantity -= item.quantity
            line_total = drug.unit_price * item.quantity
            total_billed += line_total

            # 2. Log the transaction to dispense_logs
            new_log = DispenseLog(
                drug_id=item.drug_id,
                patient_id=request.patient_id,
                record_id=request.record_id,
                quantity_dispensed=item.quantity,
                total_cost=line_total,
                dispensed_by=staff_id, # Uses safely extracted staff ID
                notes=f"Payment via {request.payment_method}"
            )
            db.add(new_log)

        # 3. Commit Transaction
        db.commit()
        return {"status": "success", "message": "Dispensed successfully", "total_billed": total_billed}

    except HTTPException:
        # Re-raise known 400/401/404 errors so they reach the frontend normally
        raise 
    except Exception as e:
        # 4. Expose the EXACT Python error, rollback DB, and log to terminal
        db.rollback()
        error_trace = traceback.format_exc()
        print("\n--- 🛑 TRANSACTION FAILED ---")
        print(error_trace)
        print("------------------------------\n")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")