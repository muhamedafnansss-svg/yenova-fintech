from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.database.config import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.middleware.deps import require_role
from app.utils.auth import get_password_hash

router = APIRouter(prefix="/api/users", tags=["users"])

# Only Admins can manage users
admin_only = Depends(require_role(["Admin"]))

def serialize_user(user: User, role: Role = None) -> dict:
    return {
        "id": user.id,
        "uuid": user.uuid,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "profile_picture": user.profile_picture,
        "role_id": user.role_id,
        "status": user.status,
        "created_at": user.created_at,
        "last_login": user.last_login,
        "role": role.name if role else ("Admin" if user.role_id == 1 else "Member"),
        "permissions": role.permissions if role else [],
        "is_primary_admin": user.id == 2 or user.email.lower() == "admin@yenova.com"
    }

@router.get("", response_model=List[UserResponse], dependencies=[admin_only])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    roles = {r.id: r for r in db.query(Role).all()}
    return [serialize_user(u, roles.get(u.role_id)) for u in users]

@router.post("", response_model=UserResponse, dependencies=[admin_only])
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email.ilike(user_in.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        uuid=str(uuid.uuid4()),
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password,
        phone=user_in.phone,
        profile_picture=user_in.profile_picture,
        role_id=user_in.role_id,
        status="Active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    role = db.query(Role).filter(Role.id == new_user.role_id).first()
    return serialize_user(new_user, role)

@router.get("/{user_id}", response_model=UserResponse, dependencies=[admin_only])
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = db.query(Role).filter(Role.id == user.role_id).first()
    return serialize_user(user, role)

@router.put("/{user_id}", response_model=UserResponse, dependencies=[admin_only])
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    is_super_admin = user.id == 2 or user.email.lower() == "admin@yenova.com"
    # Protect primary Super Admin
    if is_super_admin:
        if user_update.status and user_update.status != "Active":
            raise HTTPException(status_code=400, detail="The primary Super Admin account cannot be deactivated.")
        if user_update.role_id is not None and user_update.role_id != 1:
            raise HTTPException(status_code=400, detail="The primary Super Admin role cannot be demoted.")

    update_data = user_update.dict(exclude_unset=True)
    
    # Handle password update if supplied
    if "password" in update_data and update_data["password"]:
        if len(update_data["password"]) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
        user.password_hash = get_password_hash(update_data["password"])
        update_data.pop("password")
        
    # Check email uniqueness if email is changed
    if "email" in update_data and update_data["email"]:
        new_email = update_data["email"].strip().lower()
        if new_email != user.email.lower():
            existing = db.query(User).filter(User.email.ilike(new_email), User.id != user.id).first()
            if existing:
                raise HTTPException(status_code=400, detail="This email is already registered to another account.")
            user.email = new_email
        update_data.pop("email")

    for key, value in update_data.items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)
    role = db.query(Role).filter(Role.id == user.role_id).first()
    return serialize_user(user, role)

@router.delete("/{user_id}", dependencies=[admin_only])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == 2 or user.email.lower() == "admin@yenova.com":
        raise HTTPException(status_code=400, detail="The primary Super Admin account cannot be deleted.")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
