import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, time

from app.config.database import get_db
from app.models.billing import Billing, InvoiceItem
from app.models.laboratory import LabTest
from app.models.patient import Patient

# --- IMPORT YOUR NEW PAYMENT SERVICE ---
from app.services.payment_service import initiate_stk_push

router = APIRouter(prefix="/api/billing", tags=["Billing & Cashier"])

# --- SCHEMAS ---
class BillableItem(BaseModel):
    reference_id: int
    item_type: str # e.g., "Laboratory"
    description: str
    amount: float

class PaymentRequest(BaseModel):
    patient_id: int
    items: List[BillableItem]
    payment_method: str = "Cash" # Cash, M-Pesa, Card, Insurance

class MPesaRequest(BaseModel):
    patient_id: int
    phone_number: str
    items: List[BillableItem]


# ==========================================
# 1. CASHIER POS ENDPOINTS
# ==========================================

@router.get("/queue")
def get_billing_queue(db: Session = Depends(get_db)):
    """Finds all patients who have unbilled services (Currently looking at Lab Tests)."""
    
    # Subquery: Get all Lab Test IDs that have ALREADY been billed
    billed_test_ids = db.query(InvoiceItem.reference_id).filter(InvoiceItem.item_type == "Laboratory")
    
    # Query: Find patients who have Lab Tests that are NOT in the billed list
    unbilled_patients = db.query(Patient).join(LabTest).filter(
        LabTest.test_id.notin_(billed_test_ids)
    ).distinct().all()

    return [
        {
            "patient_id": p.patient_id,
            "patient_name": f"{p.surname}, {p.other_names}",
            "outpatient_no": p.outpatient_no
        } for p in unbilled_patients
    ]

@router.get("/unbilled/{patient_id}")
def get_unbilled_items(patient_id: int, db: Session = Depends(get_db)):
    """Fetches all unbilled line items for a specific patient."""
    
    billed_test_ids = db.query(InvoiceItem.reference_id).filter(InvoiceItem.item_type == "Laboratory")
    
    unbilled_lab_tests = db.query(LabTest).filter(
        LabTest.patient_id == patient_id,
        LabTest.test_id.notin_(billed_test_ids)
    ).all()
    
    items = []
    total_due = 0.0
    
    for test in unbilled_lab_tests:
        items.append({
            "reference_id": test.test_id,
            "item_type": "Laboratory",
            "description": f"Lab Test: {test.test_name}",
            "amount": test.billed_price,
            "date": test.requested_at.strftime("%Y-%m-%d")
        })
        total_due += test.billed_price
        
    return {
        "patient_id": patient_id,
        "items": items,
        "total_due": total_due
    }

@router.post("/process-payment", status_code=status.HTTP_201_CREATED)
def process_payment(req: PaymentRequest, db: Session = Depends(get_db)):
    """Generates the official invoice and marks the items as paid (CASH/INSURANCE)."""
    if not req.items:
        raise HTTPException(status_code=400, detail="Cannot process an empty invoice.")

    # Calculate Total
    total_amount = sum(item.amount for item in req.items)
    
    # Create the Master Invoice Record
    new_invoice = Billing(
        patient_id=req.patient_id,
        total_amount=total_amount,
        status="Paid"
    )
    db.add(new_invoice)
    db.flush() # Flush to get the invoice_id
    
    # Create the Line Items
    for item in req.items:
        invoice_item = InvoiceItem(
            invoice_id=new_invoice.invoice_id,
            description=item.description,
            amount=item.amount,
            item_type=item.item_type,
            reference_id=item.reference_id,
            tax_type="E" # Exempt for medical services
        )
        db.add(invoice_item)
        
    db.commit()
    db.refresh(new_invoice)
    
    return {
        "message": "Payment processed successfully.",
        "invoice_id": new_invoice.invoice_id,
        "total_paid": new_invoice.total_amount
    }


# ==========================================
# 2. M-PESA INTEGRATION ENDPOINTS
# ==========================================

@router.post("/process-mpesa", status_code=status.HTTP_200_OK)
def process_mpesa_payment(req: MPesaRequest, db: Session = Depends(get_db)):
    """Creates a 'Pending' invoice and triggers the STK Push to the patient's phone."""
    if not req.items:
        raise HTTPException(status_code=400, detail="Cannot process an empty invoice.")

    total_amount = sum(item.amount for item in req.items)
    
    # 1. Create Invoice as "Pending M-Pesa"
    new_invoice = Billing(
        patient_id=req.patient_id,
        total_amount=total_amount,
        status="Pending M-Pesa" 
    )
    db.add(new_invoice)
    db.flush()
    
    for item in req.items:
        invoice_item = InvoiceItem(
            invoice_id=new_invoice.invoice_id,
            description=item.description,
            amount=item.amount,
            item_type=item.item_type,
            reference_id=item.reference_id,
            tax_type="E"
        )
        db.add(invoice_item)
    
    db.commit()

    # 2. Trigger the STK Push
    invoice_ref = f"INV-{new_invoice.invoice_id}"
    try:
        daraja_response = initiate_stk_push(
            phone_number=req.phone_number,
            amount=total_amount,
            reference=invoice_ref
        )
        # Note: You can store daraja_response["CheckoutRequestID"] in the DB here to track it
    except Exception as e:
        logging.error(f"Daraja Error: {str(e)}")
        # If STK Push fails, we might want to roll back the invoice, or leave it pending for retry
        raise HTTPException(status_code=500, detail="Failed to connect to Safaricom Daraja API.")

    return {
        "message": "STK Push sent to patient's phone.",
        "invoice_id": new_invoice.invoice_id,
        "checkout_request_id": daraja_response.get("CheckoutRequestID")
    }

@router.post("/mpesa-callback")
async def mpesa_callback(request: Request, db: Session = Depends(get_db)):
    """Safaricom will POST to this URL when the patient enters their PIN (or cancels)."""
    callback_data = await request.json()
    stk_callback = callback_data.get("Body", {}).get("stkCallback", {})
    
    result_code = stk_callback.get("ResultCode")
    checkout_request_id = stk_callback.get("CheckoutRequestID")
    
    if result_code == 0:
        # Payment was successful!
        meta_items = stk_callback.get("CallbackMetadata", {}).get("Item", [])
        receipt_no = next((item["Value"] for item in meta_items if item["Name"] == "MpesaReceiptNumber"), "UNKNOWN")
        
        logging.info(f"✅ M-PESA PAYMENT SUCCESS! Receipt: {receipt_no}")
        
        # TODO: Update the Billing status from "Pending M-Pesa" to "Paid"
        # db.query(Billing).filter(Billing.checkout_request_id == checkout_request_id).update({
        #     "status": "Paid", 
        #     "transaction_ref": receipt_no
        # })
        # db.commit()
    else:
        # Payment Failed (User cancelled, wrong PIN, insufficient funds)
        fail_reason = stk_callback.get("ResultDesc", "Unknown error")
        logging.warning(f"❌ M-PESA PAYMENT FAILED: {fail_reason}")
        
        # TODO: Update the Billing status to "Failed" or "Cancelled"
        
    # Safaricom requires this exact JSON response to know we received the callback
    return {"ResultCode": 0, "ResultDesc": "Accepted"}


# ==========================================
# 3. FINANCIAL LEDGER & ANALYTICS ENDPOINTS
# ==========================================

@router.get("/overview")
def get_billing_overview(db: Session = Depends(get_db)):
    """Calculates live metrics for the top Dashboard cards."""
    
    today_start = datetime.combine(datetime.today(), time.min)
    month_start = today_start.replace(day=1)

    today_stats = db.query(
        func.sum(Billing.total_amount).label("revenue"),
        func.count(Billing.invoice_id).label("count")
    ).filter(
        Billing.status == "Paid",
        Billing.billing_date >= today_start
    ).first()

    today_revenue = float(today_stats.revenue or 0.0)
    transactions_today = today_stats.count or 0

    monthly_stats = db.query(func.sum(Billing.total_amount).label("revenue")).filter(
        Billing.status == "Paid",
        Billing.billing_date >= month_start
    ).first()
    
    monthly_revenue = float(monthly_stats.revenue or 0.0)

    avg_stats = db.query(func.avg(Billing.total_amount).label("avg")).filter(
        Billing.status == "Paid"
    ).first()
    
    average_order_value = float(avg_stats.avg or 0.0)

    return {
        "today_revenue": today_revenue,
        "monthly_revenue": monthly_revenue,
        "transactions_today": transactions_today,
        "average_order_value": average_order_value
    }

@router.get("/transactions")
def get_recent_transactions(db: Session = Depends(get_db)):
    """Fetches the 50 most recent settled invoices for the data table."""
    
    invoices = db.query(Billing).options(
        joinedload(Billing.patient),
        joinedload(Billing.items)
    ).filter(Billing.status == "Paid").order_by(desc(Billing.billing_date)).limit(50).all()

    results = []
    for inv in invoices:
        results.append({
            "transaction_id": f"INV-{str(inv.invoice_id).zfill(6)}",
            "date": inv.billing_date,
            "patient": f"{inv.patient.surname}, {inv.patient.other_names}" if inv.patient else "Walk-in Client",
            "item_count": len(inv.items),
            "total_cost": float(inv.total_amount)
        })
        
    return results