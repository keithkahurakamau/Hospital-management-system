import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.user import User

# Load variables from .env
load_dotenv()

# --- CONFIGURATION ---
SECRET_KEY = os.getenv("SECRET_KEY", "medicare_erp_fallback_secret_7722")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Only used so the FastAPI Swagger UI (/docs) doesn't break
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

# --- PASSWORD VERIFICATION ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the provided password matches the hashed one in the database."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a password for secure database storage."""
    return pwd_context.hash(password)

# --- JWT MANAGEMENT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a signed JSON Web Token (JWT)."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- 🚨 NEW: COOKIE EXTRACTION LOGIC 🚨 ---
def get_token_from_cookie(request: Request):
    """Extracts the JWT from the secure HttpOnly cookie instead of the header."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Missing secure cookie.",
        )
    
    # The cookie value looks like "Bearer eyJhb...", so we strip the prefix
    scheme, _, param = token.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
        )
    return param

def get_current_user(token: str = Depends(get_token_from_cookie), db: Session = Depends(get_db)):
    """
    The 'Security Guard' dependency.
    Reads the cookie, decodes the JWT, and verifies the user exists in the DB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.PyJWTError:
        raise credentials_exception
        
    # Verify the user actually exists in the database and isn't suspended
    user = db.query(User).filter(User.email == user_email).first()
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
        
    # Return user details required by the downstream routes
    return {"email": user.email, "role": user.role, "user_id": user.user_id}

# --- ROLE BASED ACCESS CONTROL (RBAC) ---
def require_clinical_access(user: dict = Depends(get_current_user)):
    """
    RBAC Lock: Ensures the logged-in user has the 'DOCTOR' role.
    Used to protect sensitive Medical Records.
    """
    if user.get("role") != "DOCTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Clinical permissions required."
        )
    return user