from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Location(Base):
    """Storage Locations: e.g., 'Main Pharmacy', 'Lab Store', 'OPD Cabinet'"""
    __tablename__ = "locations"
    __table_args__ = {'extend_existing': True}

    location_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(255))

class InventoryItem(Base):
    """The Master Catalog of Drugs and Supplies (No quantities here)"""
    __tablename__ = "inventory_items"
    __table_args__ = {'extend_existing': True}

    item_id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), unique=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50)) # 'Drug', 'Consumable', 'Reagent'
    unit_price = Column(Float, nullable=False)
    reorder_threshold = Column(Integer, default=10) # For User Story 5.3 (Alerts)
    is_active = Column(Boolean, default=True)

class StockBatch(Base):
    """The physical stock. Links an Item to a Location with Expiry and Quantity"""
    __tablename__ = "stock_batches"
    __table_args__ = {'extend_existing': True}

    batch_id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.item_id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.location_id"), nullable=False)
    
    batch_number = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    expiry_date = Column(DateTime, nullable=False) # Critical for User Story 4.1 (FEFO)
    
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("InventoryItem")
    location = relationship("Location")