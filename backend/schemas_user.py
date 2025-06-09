from pydantic import BaseModel

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    email: str
    role: str
