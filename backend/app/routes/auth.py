import os
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config.database import get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token, get_password_hash 
from app.core.limiter import limiter # 🚨 Added Limiter Import

router = APIRouter(prefix="/api/auth", tags=["Security"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
@limiter.limit("5/minute") # 🚨 The Brute-Force Shield! Max 5 attempts per minute per IP.
def login(request: Request, req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    # 1. Check if user exists
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Account with this email does not exist."
        )

    # 2. Check password
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect password. Please try again."
        )

    # 3. Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Your account has been suspended. Contact Admin."
        )

    # 4. Generate Token
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    # 5. Set the Highly Secure HttpOnly Cookie
    # 🚨 CRITICAL: samesite="none" and secure=True are REQUIRED for Vercel -> Render
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,          # Prevents Cross-Site Scripting (XSS)
        secure=True,            # MUST BE TRUE for cross-domain cookies (HTTPS)
        samesite="none",        # MUST BE "none" to allow cross-site cookie sharing
        max_age=120 * 60        # Token expires in 2 hours
    )
    
    # 6. Return UI Data
    return {
        "message": "Login successful",
        "user_id": user.user_id, # REQUIRED for WebSocket
        "role": user.role,
        "full_name": user.full_name
    }

@router.post("/logout")
def logout(response: Response):
    """Clears the HttpOnly cookie to securely log the user out."""
    # 🚨 CRITICAL: Deletion rules must match creation rules exactly
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="none"
    )
    return {"message": "Successfully logged out"}