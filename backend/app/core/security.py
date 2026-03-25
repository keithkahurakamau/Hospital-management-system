import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from passlib.context import CryptContext

# Load variables from .env
load_dotenv()

# --- CONFIGURATION ---
# We fetch from environment, but provide safe fallbacks for local development
SECRET_KEY = os.getenv("SECRET_KEY", "medicare_erp_fallback_secret_7722")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This tells FastAPI where to look for the token in the request (Authorization: Bearer <token>)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# --- PASSWORD VERIFICATION ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the provided password matches the hashed one in the database."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a password for secure database storage."""
    return pwd_context.hash(password)

# --- JWT MANAGEMENT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Creates a signed JSON Web Token (JWT).
    Payload contains user email, role, and name.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    The 'Security Guard' dependency.
    Decodes the JWT and verifies it hasn't expired or been tampered with.
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
        return payload  # This returns the full user info (email, role, name)
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.PyJWTError:
        raise credentials_exception

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