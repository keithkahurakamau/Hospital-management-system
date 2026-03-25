from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, date, timedelta

from app.config.database import get_db
from app.models.pharmacy import DispenseLog, DrugInventory
from app.models.patient import Patient
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/api/billing", tags=["Billing & Financials"])

@router.get("/overview")
def get_billing_overview(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Calculates high-level financial KPIs using SQL aggregation functions for optimal performance."""
    today = date.today()
    first_day_of_month = today.replace(day=1)

    # 1. Today's Revenue
    today_rev = db.query(func.sum(DispenseLog.total_cost)).filter(
        func.date(DispenseLog.dispensed_at) == today
    ).scalar() or 0.0

    # 2. Monthly Revenue
    monthly_rev = db.query(func.sum(DispenseLog.total_cost)).filter(
        func.date(DispenseLog.dispensed_at) >= first_day_of_month
    ).scalar() or 0.0

    # 3. Transaction Volume
    tx_count = db.query(func.count(DispenseLog.dispense_id)).filter(
        func.date(DispenseLog.dispensed_at) == today
    ).scalar() or 0

    # 4. Average Order Value (AOV)
    aov = (today_rev / tx_count) if tx_count > 0 else 0.0

    return {
        "today_revenue": today_rev,
        "monthly_revenue": monthly_rev,
        "transactions_today": tx_count,
        "average_order_value": aov
    }

@router.get("/transactions")
def get_recent_transactions(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Fetches the detailed ledger. 
    Uses an outer join for Patients, as Walk-in clients will have a NULL patient_id.
    """
    logs = db.query(DispenseLog, DrugInventory, User, Patient).join(
        DrugInventory, DispenseLog.drug_id == DrugInventory.drug_id
    ).join(
        User, DispenseLog.dispensed_by == User.user_id
    ).outerjoin(
        Patient, DispenseLog.patient_id == Patient.patient_id
    ).order_by(desc(DispenseLog.dispensed_at)).limit(50).all()

    return [
        {
            "transaction_id": f"MC-{log.DispenseLog.dispense_id:06d}",
            "date": log.DispenseLog.dispensed_at,
            "drug_name": log.DrugInventory.brand_name,
            "quantity": log.DispenseLog.quantity_dispensed,
            "total_cost": log.DispenseLog.total_cost,
            "method": log.DispenseLog.notes.replace("Payment via ", "") if log.DispenseLog.notes else "Cash",
            "cashier": log.User.full_name,
            "patient": f"{log.Patient.first_name} {log.Patient.last_name}" if log.Patient else "Walk-in Client"
        }
        for log in logs
    ]