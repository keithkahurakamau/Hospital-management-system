import jwt
from fastapi import Request, HTTPException, status, Depends
from app.core.security import SECRET_KEY, ALGORITHM

# 1. First, we extract and verify the token from the cookie
def get_current_user_token(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Session expired or missing. Please log in."
        )
        
    scheme, _, param = token.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid authentication scheme."
        )
        
    try:
        # Decode the token to get the user's data payload
        payload = jwt.decode(param, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

# 2. Next, we build a dynamic Role Checker class
class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, payload: dict = Depends(get_current_user_token)):
        user_role = payload.get("role")
        
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Access Denied: Your role ({user_role}) does not have clearance for this operation."
            )
            
        return payload

# 3. Pre-build your specific security clearances
require_admin = RoleChecker(["ADMIN"])
require_clinical = RoleChecker(["ADMIN", "DOCTOR", "NURSE", "LAB_TECH"])
require_billing = RoleChecker(["ADMIN", "CASHIER"])