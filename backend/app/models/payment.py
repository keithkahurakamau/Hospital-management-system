from sqlalchemy import Column, Integer, ForeignKey, Numeric, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base
class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("billing.bill_id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50))  # cash, card, mobile money
    payment_date = Column(DateTime(timezone=True), server_default=func.now())

    bill = relationship("Billing", back_populates="payments")

