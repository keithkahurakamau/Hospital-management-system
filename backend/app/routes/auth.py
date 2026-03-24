from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from app.config.database import get_db
from app.models.user import User
from app.core.security import create_access_token 

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Bcrypt setup with '2b' ident for high compatibility
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__ident="2b", deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Issues a JWT after verifying credentials."""
    
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not pwd_context.verify(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Account inactive. Contact administrator."
        )

    # Payload for the JWT
    token_data = {
        "sub": user.email,
        "role": user.role,
        "name": user.full_name
    }

    access_token = create_access_token(data=token_data)

    return {
        "status": "success",
        "token": access_token, 
        "user": {
            "email": user.email,
            "name": user.full_name,
            "role": user.role
        }
    }