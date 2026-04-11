import os
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["Security"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
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
    
    # 5. Environment Check for Secure Cookie Flag
    # If RENDER exists, we are on Render (HTTPS). If not, localhost (HTTP).
    is_production = os.getenv("RENDER") is not None

    # 6. Set the Highly Secure HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,          # Prevents Cross-Site Scripting (XSS)
        secure=is_production,   # True on Render, False on localhost
        samesite="lax",         # Prevents Cross-Site Request Forgery (CSRF)
        max_age=120 * 60        # Token expires in 2 hours
    )
    
    # 7. Return UI Data (Notice we no longer return the access_token here!)
    return {
        "message": "Login successful",
        "user_id": user.user_id, # REQUIRED for WebSocket
        "role": user.role,
        "full_name": user.full_name
    }

@router.post("/logout")
def logout(response: Response):
    """Clears the HttpOnly cookie to securely log the user out."""
    is_production = os.getenv("RENDER") is not None
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=is_production,
        samesite="lax"
    )
    return {"message": "Successfully logged out"}
@router.get("/seed-admin-secret-url")
def seed_admin_account(db: Session = Depends(get_db)):
    """Temporary backdoor to seed the admin account without Render Shell."""
    
    admin_email = "admin@medicare.io"
    
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if existing_admin:
        return {"message": f"✅ Admin account ({admin_email}) already exists!"}
        
    # Create the Admin
    admin_user = User(
        full_name="System Administrator",
        email=admin_email,
        hashed_password=get_password_hash("Admin@2026!"), 
        role="ADMIN", 
        is_active=True
    )
    
    db.add(admin_user)
    db.commit()
    
    return {
        "message": "🎉 SUCCESS! Database seeded.",
        "email": admin_email,
        "password": "Admin@2026!",
        "action_required": "Please delete this route from your code now for security!"
    }