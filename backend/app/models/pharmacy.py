from sqlalchemy import Column, Integer, String, Numeric
from app.config.database import Base

class Drug(Base):
    __tablename__ = "pharmacy_inventory"
    __table_args__ = {'extend_existing': True}

    drug_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    sku = Column(String(50), unique=True, index=True)
    category = Column(String(50)) # e.g., Antibiotic, Painkiller
    
    stock_quantity = Column(Integer, default=0)
    reorder_level = Column(Integer, default=20) # Alert threshold
    unit_price = Column(Numeric(10, 2), nullable=False)