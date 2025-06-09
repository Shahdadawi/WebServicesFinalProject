# backend/routes/auth.py

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from backend.database import users_collection
from backend.utils.role_checker import check_role
from backend.utils.encryption_utils import hash_password, verify_password
from bson import ObjectId

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login_user(credentials: LoginRequest):
    user = users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
        },
        "role": user["role"]
    }

class NewUser(BaseModel):
    email: str
    password: str
    role: str  # "admin" or "investigator"

@router.post("/add-user")
def add_user(user_data: dict = Body(...)):
    email = user_data.get("email")
    password = user_data.get("password")
    role = user_data.get("role")
    requester_email = user_data.get("requester_email")

    check_role(requester_email, allowed_roles=["admin"])

    if role not in ["admin", "investigator"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = users_collection.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = hash_password(password)

    users_collection.insert_one({
        "email": email,
        "password": hashed_password,
        "role": role
    })

    return {"message": "User added"}
