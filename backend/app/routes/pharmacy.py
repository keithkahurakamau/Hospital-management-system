from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from app.config.database import get_db

from app.models.inventory import StockBatch, InventoryItem, Location
from app.models.pharmacy import DispenseLog
from app.models.patient import Patient

router = APIRouter(prefix="/api/pharmacy", tags=["Pharmacy & OTC"])

# --- DATA TRANSFER OBJECTS (DTOs) ---
class DispenseItemReq(BaseModel):
    item_id: int
    quantity: int

class PrescriptionRequest(BaseModel):
    patient_id: int
    record_id: Optional[int] = None
    pharmacist_id: int = 1 
    payment_method: str = "Cash" # 'Cash' or 'M-PESA'
    phone_number: Optional[str] = None
    items: List[DispenseItemReq]

class WalkInSaleRequest(BaseModel):
    pharmacist_id: int = 1
    payment_method: str = "Cash"
    phone_number: Optional[str] = None
    items: List[DispenseItemReq]

# --- CORE ALGORITHM: FEFO DEDUCTION ---
def execute_fefo_dispensing(db: Session, item_id: int, required_qty: int, location_name: str, user_id: int, patient_id: Optional[int] = None, record_id: Optional[int] = None):
    item = db.query(InventoryItem).filter(InventoryItem.item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"InventoryItem ID {item_id} unrecognized.")

    location = db.query(Location).filter(Location.name == location_name).first()
    if not location:
        raise HTTPException(status_code=404, detail=f"Location '{location_name}' unrecognized.")

    batches = db.query(StockBatch).filter(
        StockBatch.item_id == item_id,
        StockBatch.location_id == location.location_id,
        StockBatch.quantity > 0,
        StockBatch.expiry_date > datetime.now(timezone.utc)
    ).order_by(StockBatch.expiry_date.asc()).all()

    total_available = sum(b.quantity for b in batches)
    if total_available < required_qty:
        raise HTTPException(status_code=400, detail=f"Deficit detected for {item.name}. Required: {required_qty}, Available: {total_available}")

    remaining_qty = required_qty
    logs = []

    for batch in batches:
        if remaining_qty <= 0: break
        deduct_amount = min(batch.quantity, remaining_qty)
        batch.quantity -= deduct_amount
        remaining_qty -= deduct_amount

        log = DispenseLog(
            batch_id=batch.batch_id, patient_id=patient_id, record_id=record_id,
            quantity_dispensed=deduct_amount, total_cost=deduct_amount * item.unit_price, dispensed_by=user_id
        )
        db.add(log)
        logs.append(log)

    return logs

# --- ENDPOINTS ---
@router.post("/dispense/prescription", status_code=status.HTTP_201_CREATED)
def dispense_prescription(payload: PrescriptionRequest, db: Session = Depends(get_db)):
    if payload.payment_method == "M-PESA" and not payload.phone_number:
        raise HTTPException(status_code=400, detail="M-PESA STK Push requires a valid phone number.")

    generated_logs = []
    try:
        # Note: Safaricom Daraja API STK Push logic would be invoked here synchronously.
        for request_item in payload.items:
            logs = execute_fefo_dispensing(db, request_item.item_id, request_item.quantity, "Pharmacy", payload.pharmacist_id, payload.patient_id, payload.record_id)
            generated_logs.extend(logs)
            
        db.commit()
        return {"status": "success", "dispensed_batches": len(generated_logs), "payment_method": payload.payment_method}
    except Exception as e:
        db.rollback() 
        raise e

@router.post("/dispense/walk-in", status_code=status.HTTP_201_CREATED)
def process_walk_in_sale(payload: WalkInSaleRequest, db: Session = Depends(get_db)):
    if payload.payment_method == "M-PESA" and not payload.phone_number:
        raise HTTPException(status_code=400, detail="M-PESA STK Push requires a valid phone number.")

    generated_logs = []
    try:
        for request_item in payload.items:
            logs = execute_fefo_dispensing(db, request_item.item_id, request_item.quantity, "Pharmacy", payload.pharmacist_id, None, None)
            generated_logs.extend(logs)
            
        db.commit()
        return {"status": "success", "dispensed_batches": len(generated_logs), "payment_method": payload.payment_method}
    except Exception as e:
        db.rollback()
        raise e

@router.get("/catalog")
def get_inventory_catalog(db: Session = Depends(get_db)):
    return db.query(InventoryItem).filter(InventoryItem.is_active == True).all()

@router.get("/patients")
def get_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()