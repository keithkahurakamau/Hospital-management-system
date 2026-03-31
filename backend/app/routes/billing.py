from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from datetime import datetime, date
from pydantic import BaseModel

from app.config.database import get_db
from app.models.billing import Billing, InvoiceItem
from app.models.patient import Patient
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/api/billing", tags=["Billing & Financials"])

class PaymentRequest(BaseModel):
    payment_method: str

# --- CASHIER DESK ENDPOINTS ---

@router.get("/pending")
def get_pending_invoices(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Fetches all unpaid patient invoices for the Cashier POS."""
    invoices = db.query(Billing).options(
        joinedload(Billing.patient),
        joinedload(Billing.items)
    ).filter(Billing.status == "Pending").order_by(Billing.billing_date.desc()).all()

    return [
        {
            "invoice_id": inv.invoice_id,
            "patient_name": f"{inv.patient.first_name} {inv.patient.last_name}" if inv.patient else "Walk-in Client",
            "outpatient_no": inv.patient.outpatient_no if inv.patient else "N/A",
            "total_amount": float(inv.total_amount),
            "date": inv.billing_date,
            "items": [{"description": item.description, "amount": item.amount} for item in inv.items]
        }
        for inv in invoices
    ]

@router.post("/{invoice_id}/pay")
def process_payment(invoice_id: int, req: PaymentRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Processes payment for an invoice and marks it as Paid."""
    invoice = db.query(Billing).filter(Billing.invoice_id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    if invoice.status == "Paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid.")

    # In a real app, you would log the payment method to a Payment table here.
    invoice.status = "Paid"
    db.commit()
    
    return {"message": "Payment processed successfully.", "total_paid": float(invoice.total_amount)}


# --- FINANCIAL LEDGER ENDPOINTS ---

@router.get("/overview")
def get_billing_overview(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Calculates high-level financial KPIs based on PAID invoices."""
    today = date.today()
    first_day_of_month = today.replace(day=1)

    # 1. Today's Revenue
    today_rev = db.query(func.sum(Billing.total_amount)).filter(
        func.date(Billing.billing_date) == today,
        Billing.status == "Paid"
    ).scalar() or 0.0

    # 2. Monthly Revenue
    monthly_rev = db.query(func.sum(Billing.total_amount)).filter(
        func.date(Billing.billing_date) >= first_day_of_month,
        Billing.status == "Paid"
    ).scalar() or 0.0

    # 3. Transaction Volume Today
    tx_count = db.query(func.count(Billing.invoice_id)).filter(
        func.date(Billing.billing_date) == today,
        Billing.status == "Paid"
    ).scalar() or 0

    # 4. Average Order Value (AOV)
    aov = (float(today_rev) / tx_count) if tx_count > 0 else 0.0

    return {
        "today_revenue": float(today_rev),
        "monthly_revenue": float(monthly_rev),
        "transactions_today": tx_count,
        "average_order_value": float(aov)
    }

@router.get("/transactions")
def get_recent_transactions(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Fetches the detailed ledger of completed transactions."""
    logs = db.query(Billing).options(
        joinedload(Billing.patient),
        joinedload(Billing.items)
    ).filter(Billing.status == "Paid").order_by(desc(Billing.billing_date)).limit(50).all()

    return [
        {
            "transaction_id": f"INV-{log.invoice_id:06d}",
            "date": log.billing_date,
            "patient": f"{log.patient.first_name} {log.patient.last_name}" if log.patient else "Walk-in Client",
            "total_cost": float(log.total_amount),
            "item_count": len(log.items),
            "method": "System Checkout" # Placeholder until a Payment table is linked
        }
        for log in logs
    ]