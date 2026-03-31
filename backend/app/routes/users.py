from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.config.database import get_db
from app.models.user import User
from app.core.security import get_current_user, get_password_hash 
from app.core.websocket import manager

router = APIRouter(prefix="/api/users", tags=["User & Role Management"])

# --- SCHEMAS ---
class RoleUpdate(BaseModel):
    role: str

class StatusUpdate(BaseModel):
    is_active: bool

class PrivilegeUpdate(BaseModel):
    permissions: Dict[str, bool]

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: str

class RoleCreate(BaseModel):
    role: str

# --- MASTER PRIVILEGE DICTIONARY ---
SYSTEM_PRIVILEGES = {
    "manage_users": "Manage Staff & Access Control",
    "view_financials": "View Financial Ledger & Billing",
    "manage_inventory": "Manage Pharmacy & POS",
    "manage_stock": "Manage Central Inventory",  # <--- THE NEW PRIVILEGE
    "consult_patients": "Clinical Consultation & Records",
    "register_patients": "Patient Registration & Triage",
    "manage_labs": "Process Laboratory Tests",
    "manage_appointments": "Schedule & Manage Appointments",
    "manage_beds": "Manage Ward & Bed Allocations",
    "view_reports": "View System Analytics & Reports"
}

DEFAULT_PRIVILEGES = {
    "ADMIN": {k: True for k in SYSTEM_PRIVILEGES.keys()}, 
    "DOCTOR": {"consult_patients": True, "view_reports": True},
    "RECEPTIONIST": {"register_patients": True, "view_financials": True, "manage_appointments": True, "manage_beds": True},
    "PHARMACIST": {"manage_inventory": True, "manage_stock": True, "view_financials": True}, # Pharmacist gets it by default
    "LAB_TECH": {"manage_labs": True}
}

# --- USER MANAGEMENT ENDPOINTS ---

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.user_id}

@router.get("/")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"user_id": u.user_id, "full_name": u.full_name, "email": u.email, "role": u.role, "is_active": u.is_active} for u in users]

@router.put("/{user_id}/role")
def update_user_role(user_id: int, req: RoleUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.role = req.role
    db.commit()
    return {"message": "Role updated"}

@router.put("/{user_id}/status")
def update_user_status(user_id: int, req: StatusUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.is_active = req.is_active
    db.commit()
    return {"message": "Status updated"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if user.role == "ADMIN": raise HTTPException(status_code=403, detail="Cannot delete Admin accounts.")

    try:
        db.delete(user)
        db.commit()
        return {"message": "User permanently deleted."}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="User has clinical records. Please Suspend instead.")

# --- ROLE MANAGEMENT ENDPOINTS ---

@router.post("/roles/")
def create_new_role(req: RoleCreate):
    formatted_role = req.role.upper().replace(" ", "_")
    if formatted_role in DEFAULT_PRIVILEGES:
        raise HTTPException(status_code=400, detail="Role already exists")
    
    DEFAULT_PRIVILEGES[formatted_role] = {k: False for k in SYSTEM_PRIVILEGES.keys()}
    return {"message": f"Role {formatted_role} created."}

@router.get("/system-privileges/")
def get_system_privileges():
    return SYSTEM_PRIVILEGES

@router.get("/roles/privileges/")
def get_role_privileges(db: Session = Depends(get_db)):
    active_roles = db.query(User.role).distinct().all()
    for (role,) in active_roles:
        if role and role not in DEFAULT_PRIVILEGES:
            DEFAULT_PRIVILEGES[role] = {k: False for k in SYSTEM_PRIVILEGES.keys()}
    return DEFAULT_PRIVILEGES

@router.put("/roles/{role_name}/privileges")
async def update_role_privileges(role_name: str, req: PrivilegeUpdate, db: Session = Depends(get_db)):
    if role_name not in DEFAULT_PRIVILEGES:
        DEFAULT_PRIVILEGES[role_name] = {}
    DEFAULT_PRIVILEGES[role_name].update(req.permissions)
    await manager.broadcast_to_role(role_name, {"type": "REFRESH_PERMISSIONS"}, db)
    return {"message": f"Privileges updated for {role_name}"}

@router.get("/me/permissions/")
def get_my_permissions(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    
    if role == "ADMIN":
        return {"role": role, "permissions": {k: True for k in SYSTEM_PRIVILEGES.keys()}}
        
    return {"role": role, "permissions": DEFAULT_PRIVILEGES.get(role, {})}

@router.delete("/roles/{role_name}")
def delete_role(role_name: str, db: Session = Depends(get_db)):
    base_roles = ["ADMIN", "DOCTOR", "RECEPTIONIST", "PHARMACIST", "LAB_TECH"]
    if role_name in base_roles:
        raise HTTPException(status_code=403, detail="Cannot delete core system roles.")
    
    assigned_user = db.query(User).filter(User.role == role_name).first()
    if assigned_user:
        raise HTTPException(status_code=400, detail=f"Cannot delete. There are users currently assigned to the {role_name} role. Please reassign them first.")
        
    if role_name in DEFAULT_PRIVILEGES:
        del DEFAULT_PRIVILEGES[role_name]
        
    return {"message": f"Role {role_name} successfully deleted."}