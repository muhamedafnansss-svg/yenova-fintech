from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from app.database.config import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.token import Token, LoginRequest
from app.schemas.user import UserResponse
from app.utils.auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.middleware.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.status != "Active":
        raise HTTPException(status_code=400, detail="Inactive user")

    role = db.query(Role).filter(Role.id == user.role_id).first()
    
    expires = timedelta(days=30) if login_data.remember_me else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"uuid": user.uuid, "role": role.name if role else "Member"}, expires_delta=expires
    )
    
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    
    # Create a dict that matches UserResponse schema
    user_dict = {
        "id": current_user.id,
        "uuid": current_user.uuid,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "profile_picture": current_user.profile_picture,
        "role_id": current_user.role_id,
        "status": current_user.status,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login,
        "role": role.name if role else "Member",
        "permissions": role.permissions if role else [],
        "is_primary_admin": current_user.email.lower() == "admin@yenova.com"
    }
    return user_dict

@router.post("/logout")
def logout():
    # In a full stateful implementation, we could invalidate the token by storing it in a blacklist or deleting the session.
    # For now, client just deletes the JWT.
    return {"message": "Logged out successfully"}
