from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config.database import get_db
from app.models.patient import Patient
from app.models.bed import Bed
from app.models.laboratory import LabTest
import random
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Reports"])

@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Aggregates hospital data for the advanced reporting dashboard."""
    
    # 1. Clinical Metrics (Real data from your tables)
    total_patients = db.query(Patient).count()
    
    total_beds = db.query(Bed).count()
    occupied_beds = db.query(Bed).filter(Bed.status == "Occupied").count()
    occupancy_rate = round((occupied_beds / total_beds * 100) if total_beds > 0 else 0, 1)

    pending_labs = db.query(LabTest).filter(LabTest.status == "Pending").count()

    # 2. Financial & Integration Telemetry 
    # (Using mocked trend data here to feed the charts until the actual M-Pesa/Billing webhooks are fully wired)
    
    # Generate 6 months of revenue trends
    months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
    revenue_trend = []
    for m in months:
        base_rev = random.randint(450000, 850000) # e.g., KES 450k - 850k
        revenue_trend.append({
            "name": m,
            "M_Pesa": int(base_rev * 0.65),    # 65% paid via STK Push
            "Insurance": int(base_rev * 0.25), # 25% NHIF/Private
            "Cash": int(base_rev * 0.10)       # 10% Physical Cash
        })

    # Generate 7 days of patient registration trends
    patient_trend = []
    for i in range(6, -1, -1):
        date = datetime.now() - timedelta(days=i)
        patient_trend.append({
            "name": date.strftime("%a"),
            "New Patients": random.randint(5, 25)
        })

    return {
        "kpis": {
            "total_patients": total_patients,
            "occupancy_rate": occupancy_rate,
            "pending_labs": pending_labs,
            "monthly_revenue": sum(d["M_Pesa"] + d["Insurance"] + d["Cash"] for d in revenue_trend[-1:])
        },
        "charts": {
            "revenue_trend": revenue_trend,
            "patient_trend": patient_trend
        },
        "integrations": {
            "kra_etims": {"status": "Online", "last_sync": "2 mins ago", "unsynced_invoices": 0},
            "mpesa_c2b": {"status": "Active", "today_collections": random.randint(45000, 120000)},
            "sms_gateway": {"status": "Active", "delivery_rate": "99.8%"}
        }
    }