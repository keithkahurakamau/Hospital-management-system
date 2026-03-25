from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict
from app.config.database import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.core.websocket import manager

router = APIRouter(prefix="/api/users", tags=["User & Role Management"])

class RoleUpdate(BaseModel):
    role: str

class PrivilegeUpdate(BaseModel):
    permissions: Dict[str, bool]

# --- MASTER PRIVILEGE DICTIONARY ---
# This represents every actionable module in the entire hospital codebase.
SYSTEM_PRIVILEGES = {
    "manage_users": "Manage Staff & Access Control",
    "view_financials": "View Financial Ledger & Billing",
    "manage_inventory": "Manage Pharmacy & Inventory",
    "consult_patients": "Clinical Consultation & Records",
    "register_patients": "Patient Registration & Triage",
    "manage_labs": "Process Laboratory Tests",
    "manage_appointments": "Schedule & Manage Appointments",
    "manage_beds": "Manage Ward & Bed Allocations",
    "view_reports": "View System Analytics & Reports"
}

# Default states for standard roles.
DEFAULT_PRIVILEGES = {
    "ADMIN": {k: True for k in SYSTEM_PRIVILEGES.keys()}, # Admins get everything
    "DOCTOR": {"consult_patients": True, "view_reports": True},
    "RECEPTIONIST": {"register_patients": True, "view_financials": True, "manage_appointments": True, "manage_beds": True},
    "PHARMACIST": {"manage_inventory": True, "view_financials": True},
    "LAB_TECH": {"manage_labs": True}
}

# --- ENDPOINTS ---

@router.get("/system-privileges")
def get_system_privileges(current_user: dict = Depends(get_current_user)):
    """Returns the master list of all available system privileges and their labels."""
    return SYSTEM_PRIVILEGES

@router.get("/me/permissions")
def get_my_permissions(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    return {"role": role, "permissions": DEFAULT_PRIVILEGES.get(role, {})}

@router.get("/")
def get_all_users(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    users = db.query(User).all()
    return [{"user_id": u.user_id, "full_name": u.full_name, "email": u.email, "role": u.role, "is_active": u.is_active} for u in users]

@router.get("/roles/privileges")
def get_role_privileges(current_user: dict = Depends(get_current_user)):
    return DEFAULT_PRIVILEGES

@router.put("/roles/{role_name}/privileges")
async def update_role_privileges(role_name: str, req: PrivilegeUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if role_name not in DEFAULT_PRIVILEGES:
        DEFAULT_PRIVILEGES[role_name] = {}
    
    DEFAULT_PRIVILEGES[role_name].update(req.permissions)
    await manager.broadcast_to_role(role_name, {"type": "REFRESH_PERMISSIONS"}, db)
    return {"message": f"Privileges updated for {role_name}"}