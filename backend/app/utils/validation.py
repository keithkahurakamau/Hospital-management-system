import re
from fastapi import HTTPException

def validate_kenyan_phone(phone: str):
    # Matches +254..., 254..., or 07.../01...
    pattern = r'^(?:254|\+254|0)?(7|1)(?:[0-9]{8})$'
    if not re.match(pattern, phone):
        raise HTTPException(status_code=400, detail="Invalid Kenyan Phone Number")
    
    # Normalize to 254... for M-Pesa compatibility
    if phone.startswith('0'):
        return '254' + phone[1:]
    if phone.startswith('+'):
        return phone[1:]
    return phone