# backend/utils/role_checker.py

from fastapi import HTTPException
from backend.database import users_collection

def check_role(email: str, allowed_roles: list):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="You don't have permission")
