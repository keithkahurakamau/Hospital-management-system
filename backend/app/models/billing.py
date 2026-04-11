from sqlalchemy import Column, Integer, ForeignKey, Numeric, DateTime, String, Float, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Billing(Base):
    __tablename__ = "billing"
    __table_args__ = {'extend_existing': True}

    invoice_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id"), nullable=True)
    
    total_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    status = Column(String(50), default="Pending") # Pending, Paid, Partially Paid, Cancelled
    billing_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    patient = relationship("Patient")
    appointment = relationship("Appointment")
    
    # Allows us to access all items via billing_obj.items
    items = relationship("InvoiceItem", back_populates="parent_invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("billing.invoice_id"), nullable=False)
    
    description = Column(String(255), nullable=False) # e.g., "Consultation Fee", "Lab: CBC"
    amount = Column(Float, nullable=False)
    
    # --- NEW: Universal Linkers ---
    # These decouple billing from specific modules. The Cashier doesn't need to know 
    # HOW a lab test works, they just need to know it's a "Laboratory" item and its ID.
    item_type = Column(String(50), nullable=True) # e.g., "Laboratory", "Pharmacy", "Consultation"
    reference_id = Column(Integer, nullable=True) # e.g., The specific Lab Test ID or Prescription ID
    
    # eTIMS Compliance: A (Exempt), B (16%), C (Zero Rated), E (Non-Taxable)
    tax_type = Column(String(10), default="E") 

    parent_invoice = relationship("Billing", back_populates="items")