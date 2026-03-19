from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.config.database import get_db
from app.models.pharmacy import Drug

router = APIRouter(prefix="/api/pharmacy", tags=["Pharmacy Inventory"])

class DrugCreate(BaseModel):
    name: str
    sku: str
    category: str
    stock_quantity: int
    reorder_level: int
    unit_price: float

@router.get("/")
def get_inventory(db: Session = Depends(get_db)):
    """Fetches the complete pharmacy inventory."""
    drugs = db.query(Drug).order_by(Drug.name).all()
    return [
        {
            "id": d.drug_id,
            "name": d.name,
            "sku": d.sku,
            "category": d.category,
            "stock": d.stock_quantity,
            "status": "Critical" if d.stock_quantity == 0 else "Low Stock" if d.stock_quantity <= d.reorder_level else "In Stock",
            "price": float(d.unit_price)
        } for d in drugs
    ]

@router.post("/", status_code=status.HTTP_201_CREATED)
def add_new_drug(drug: DrugCreate, db: Session = Depends(get_db)):
    """Registers a new medication into the system."""
    new_drug = Drug(**drug.model_dump())
    db.add(new_drug)
    db.commit()
    db.refresh(new_drug)
    return new_drug

@router.patch("/{drug_id}/dispense")
def dispense_medication(drug_id: int, quantity: int = 1, db: Session = Depends(get_db)):
    """Deducts stock when a prescription is fulfilled."""
    drug = db.query(Drug).filter(Drug.drug_id == drug_id).first()
    
    if not drug:
        raise HTTPException(status_code=404, detail="Medication not found")
    if drug.stock_quantity < quantity:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Only {drug.stock_quantity} remaining.")
        
    drug.stock_quantity -= quantity
    db.commit()
    return {"message": "Dispensed successfully", "remaining_stock": drug.stock_quantity}