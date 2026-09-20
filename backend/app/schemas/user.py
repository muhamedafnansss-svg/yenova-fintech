from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    role_id: int

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    uuid: str
    status: str
    created_at: datetime
    last_login: Optional[datetime] = None
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_primary_admin: Optional[bool] = False

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None
    status: Optional[str] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
