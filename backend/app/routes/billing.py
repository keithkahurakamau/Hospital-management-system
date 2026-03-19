from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from app.config.database import get_db
from app.models.billing import Billing
from app.models.patient import Patient
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/billing", tags=["Billing"])

# Pydantic Schema for incoming billing data
class BillCreate(BaseModel):
    patient_id: int
    appointment_id: int = None
    total_amount: float
    description: str = "Standard Consultation"

@router.post("/", status_code=status.HTTP_201_CREATED)
def generate_invoice(bill: BillCreate, db: Session = Depends(get_db)):
    # Verify patient exists to prevent orphan bills
    patient = db.query(Patient).filter(Patient.patient_id == bill.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_bill = Billing(
        patient_id=bill.patient_id,
        appointment_id=bill.appointment_id,
        total_amount=bill.total_amount,
        status="Pending", # Default status
        billing_date=datetime.utcnow()
    )
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    return new_bill

@router.get("/")
def get_all_invoices(db: Session = Depends(get_db)):
    # Eager load the patient data so the frontend can display names
    bills = db.query(Billing).options(joinedload(Billing.patient)).order_by(Billing.invoice_id.desc()).all()
    
    return [
        {
            "invoice_id": b.invoice_id,
            "patient_name": f"{b.patient.first_name} {b.patient.last_name}",
            "amount": float(b.total_amount),
            "status": b.status,
            "date": b.billing_date.strftime("%b %d, %Y")
        } for b in bills
    ]

@router.patch("/{invoice_id}/status")
def update_payment_status(invoice_id: int, new_status: str, db: Session = Depends(get_db)):
    valid_statuses = ["Pending", "Paid", "Insurance Claimed", "Overdue"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    bill = db.query(Billing).filter(Billing.invoice_id == invoice_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    bill.status = new_status
    db.commit()
    return {"message": f"Invoice {invoice_id} marked as {new_status}"}