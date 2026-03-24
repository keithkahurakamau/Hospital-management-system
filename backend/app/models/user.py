from sqlalchemy import Column, Integer, String, Boolean
from app.config.database import Base

class User(Base):
    """Stores staff authentication and RBAC roles"""
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    
    # Never store plain-text passwords
    hashed_password = Column(String(255), nullable=False)
    
    role = Column(String(50), nullable=False) # 'DOCTOR' or 'SECRETARY'
    is_active = Column(Boolean, default=True)