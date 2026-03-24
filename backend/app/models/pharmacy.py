from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

# --- 1. The Inventory Catalog ---
class DrugInventory(Base):
    __tablename__ = "drug_inventory"
    __table_args__ = {'extend_existing': True}

    drug_id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String(100), nullable=False, index=True)
    generic_name = Column(String(100), nullable=False)
    category = Column(String(50)) # e.g., Antibiotic, Analgesic
    unit_price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, default=10)
    requires_prescription = Column(Boolean, default=True)
    last_restocked = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# --- 2. The POS Transaction Ledger ---
class DispenseLog(Base):
    """Records every time a drug leaves the pharmacy"""
    __tablename__ = "dispense_logs"
    __table_args__ = {'extend_existing': True}

    dispense_id = Column(Integer, primary_key=True, index=True)
    
    # Links to the DrugInventory model above
    drug_id = Column(Integer, ForeignKey("drug_inventory.drug_id"), nullable=False)
    
    # If None, it's a Walk-in Sale. If filled, it's a Patient Prescription.
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=True)
    record_id = Column(Integer, ForeignKey("medical_records.record_id"), nullable=True)
    
    quantity_dispensed = Column(Integer, nullable=False)
    total_cost = Column(Float, nullable=False)
    
    # The Secretary/Pharmacist who is logged in and operating the POS
    dispensed_by = Column(Integer, ForeignKey("users.user_id"), nullable=False) 
    
    dispensed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(255), nullable=True)

    # --- SQLAlchemy Relationships for easy data joining ---
    drug = relationship("DrugInventory")
    patient = relationship("Patient")
    dispenser = relationship("User")