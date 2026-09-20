from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.config import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserResponse, UserUpdate, PasswordUpdate
from app.middleware.deps import get_current_user
from app.utils.auth import get_password_hash, verify_password

router = APIRouter(prefix="/api/profile", tags=["profile"])

def serialize_user_profile(user: User, db: Session) -> dict:
    role = db.query(Role).filter(Role.id == user.role_id).first()
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

@router.get("", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_user_profile(current_user, db)

@router.put("", response_model=UserResponse)
def update_profile(
    profile_update: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    update_data = profile_update.dict(exclude_unset=True)
    # Users shouldn't update their own role or status via profile endpoint
    update_data.pop("role_id", None)
    update_data.pop("status", None)
    update_data.pop("password", None)
    
    # Check email uniqueness if email is changed
    if "email" in update_data and update_data["email"]:
        new_email = update_data["email"].strip().lower()
        if new_email != current_user.email.lower():
            existing = db.query(User).filter(User.email.ilike(new_email), User.id != current_user.id).first()
            if existing:
                raise HTTPException(status_code=400, detail="This email is already registered to another account.")
            current_user.email = new_email
        update_data.pop("email")
    
    for key, value in update_data.items():
        setattr(current_user, key, value)
        
    db.commit()
    db.refresh(current_user)
    return serialize_user_profile(current_user, db)

@router.put("/password")
def update_password(
    passwords: PasswordUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not verify_password(passwords.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
        
    if len(passwords.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
        
    current_user.password_hash = get_password_hash(passwords.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
