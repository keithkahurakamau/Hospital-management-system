from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from datetime import datetime
from app.config.database import get_db
from app.models.laboratory import LabTest
from app.models.patient import Patient

router = APIRouter(prefix="/api/lab", tags=["Laboratory"])

class TestRequest(BaseModel):
    patient_id: int
    doctor_id: int = 1 # Defaulting to 1 for prototyping
    test_name: str

class TestResultUpdate(BaseModel):
    result_summary: str

@router.get("/")
def get_all_tests(db: Session = Depends(get_db)):
    """Retrieves all lab tests, joining patient and doctor names for the UI."""
    tests = db.query(LabTest).options(
        joinedload(LabTest.patient),
        joinedload(LabTest.doctor)
    ).order_by(LabTest.status.desc(), LabTest.requested_at.desc()).all() # Pending first
    
    return [
        {
            "test_id": t.test_id,
            "patient_name": f"{t.patient.first_name} {t.patient.last_name}",
            "doctor_name": f"Dr. {t.doctor.last_name}",
            "test_name": t.test_name,
            "status": t.status,
            "result_summary": t.result_summary,
            "date": t.requested_at.strftime("%b %d, %Y - %H:%M")
        } for t in tests
    ]

@router.post("/request", status_code=status.HTTP_201_CREATED)
def request_lab_test(req: TestRequest, db: Session = Depends(get_db)):
    """Allows a doctor to order a new lab test."""
    new_test = LabTest(**req.model_dump())
    db.add(new_test)
    db.commit()
    return {"message": "Lab test requested successfully"}

@router.patch("/{test_id}/complete")
def complete_test(test_id: int, update: TestResultUpdate, db: Session = Depends(get_db)):
    """Allows lab technicians to input results and mark the test as Completed."""
    test = db.query(LabTest).filter(LabTest.test_id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test.status = "Completed"
    test.result_summary = update.result_summary
    test.completed_at = datetime.utcnow()
    db.commit()
    return {"message": "Results saved and test marked as completed"}