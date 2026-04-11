from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
from app.config.database import get_db
from app.models.laboratory import LabTestCatalog, LabTestRequiredItem
from app.models.inventory import InventoryUsageLog

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

# --- SCHEMAS ---
class RequiredItemBase(BaseModel):
    inventory_item_id: int
    item_name: str
    quantity_required: float

class RequiredItemResponse(RequiredItemBase):
    id: int
    catalog_id: int
    class Config:
        from_attributes = True

class LabTestCatalogCreate(BaseModel):
    test_name: str
    description: Optional[str] = None
    base_price: float
    is_active: Optional[bool] = True
    required_items: List[RequiredItemBase] = [] # NEW: Link inventory items directly

class LabTestCatalogResponse(BaseModel):
    catalog_id: int
    test_name: str
    description: Optional[str] = None
    base_price: float
    is_active: bool
    required_items: List[RequiredItemResponse] = []
    
    class Config:
        from_attributes = True

# --- ENDPOINTS ---

@router.get("/lab-catalog", response_model=List[LabTestCatalogResponse])
def get_lab_catalog(db: Session = Depends(get_db)):
    """Fetches the master dictionary of lab tests, prices, and required inventory items."""
    return db.query(LabTestCatalog).options(
        joinedload(LabTestCatalog.required_items)
    ).order_by(LabTestCatalog.test_name).all()

@router.post("/lab-catalog", response_model=LabTestCatalogResponse, status_code=status.HTTP_201_CREATED)
def create_catalog_item(item: LabTestCatalogCreate, db: Session = Depends(get_db)):
    """Adds a new test to the hospital's offerings, including its required reagents."""
    existing = db.query(LabTestCatalog).filter(LabTestCatalog.test_name == item.test_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A test with this name already exists.")
        
    # 1. Create Core Catalog Entry
    new_item = LabTestCatalog(
        test_name=item.test_name,
        description=item.description,
        base_price=item.base_price,
        is_active=item.is_active
    )
    db.add(new_item)
    db.flush() # Flushes to DB to generate the catalog_id without committing the transaction yet
    
    # 2. Attach Required Inventory Items
    for req in item.required_items:
        new_req = LabTestRequiredItem(
            catalog_id=new_item.catalog_id,
            inventory_item_id=req.inventory_item_id,
            item_name=req.item_name,
            quantity_required=req.quantity_required
        )
        db.add(new_req)

    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/lab-catalog/{catalog_id}", response_model=LabTestCatalogResponse)
def update_catalog_item(catalog_id: int, item: LabTestCatalogCreate, db: Session = Depends(get_db)):
    """Updates pricing, details, and required inventory for a specific lab test."""
    db_item = db.query(LabTestCatalog).filter(LabTestCatalog.catalog_id == catalog_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Catalog item not found")
        
    # 1. Update Core Fields
    db_item.test_name = item.test_name
    db_item.description = item.description
    db_item.base_price = item.base_price
    db_item.is_active = item.is_active
    
    # 2. Sync Required Items (Wipe old ones and insert new ones to ensure exact sync)
    db.query(LabTestRequiredItem).filter(LabTestRequiredItem.catalog_id == catalog_id).delete()
    
    for req in item.required_items:
        new_req = LabTestRequiredItem(
            catalog_id=catalog_id,
            inventory_item_id=req.inventory_item_id,
            item_name=req.item_name,
            quantity_required=req.quantity_required
        )
        db.add(new_req)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/inventory-logs")
def get_inventory_usage_logs(db: Session = Depends(get_db)):
    """Audit trail: See exactly what inventory was used, by whom, and when."""
    logs = db.query(InventoryUsageLog).order_by(InventoryUsageLog.timestamp.desc()).limit(200).all()
    return logs