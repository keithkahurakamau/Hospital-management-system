from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

# --- 1. Master Dictionary of Tests & Prices ---
class LabTestCatalog(Base):
    __tablename__ = "lab_test_catalog"
    __table_args__ = {'extend_existing': True}
    
    catalog_id = Column(Integer, primary_key=True, index=True)
    test_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    base_price = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

    # Relationship to the items this test consumes
    required_items = relationship("LabTestRequiredItem", back_populates="catalog_test", cascade="all, delete-orphan")


# --- 2. NEW: Inventory Link (Items consumed when this test is performed) ---
class LabTestRequiredItem(Base):
    __tablename__ = "lab_test_required_items"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    catalog_id = Column(Integer, ForeignKey("lab_test_catalog.catalog_id"), nullable=False)
    
    # ENHANCED: Now a strict Foreign Key pointing to the master inventory catalog
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.item_id"), nullable=False) 
    item_name = Column(String(150), nullable=False) # Stored here so the UI can easily display it to the Lab Tech
    quantity_required = Column(Float, nullable=False, default=1.0)

    # Relationships
    catalog_test = relationship("LabTestCatalog", back_populates="required_items")
    inventory_item = relationship("InventoryItem") # ENHANCED: Allows easy lookups to check current stock levels!


# --- 3. UPDATED: The Patient's Actual Test Request ---
class LabTest(Base):
    __tablename__ = "lab_tests"
    __table_args__ = {'extend_existing': True}

    test_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=False)
    
    # Link to the master catalog to pull pricing and inventory requirements
    catalog_id = Column(Integer, ForeignKey("lab_test_catalog.catalog_id"), nullable=True) 
    
    test_name = Column(String(100), nullable=False) # e.g., "Complete Blood Count", "MRI"
    status = Column(String(50), default="Pending")  # States: Pending, Completed
    result_summary = Column(Text, nullable=True)    # The actual lab findings entered by the tech
    
    # Financials (Locked in at the time the doctor orders it)
    billed_price = Column(Float, default=0.0) 
    
    # Timestamps
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Audit trail - Which Lab Tech performed this test?
    performed_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    # Relationships
    patient = relationship("Patient")
    doctor = relationship("Doctor")
    catalog_item = relationship("LabTestCatalog")
    lab_tech = relationship("User") # Links to the staff member who processed the results