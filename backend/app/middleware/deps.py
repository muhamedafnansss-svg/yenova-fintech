from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.config import get_db
from app.models.user import User
from app.models.role import Role
from app.utils.auth import verify_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_uuid: str = payload.get("uuid")
    if user_uuid is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.uuid == user_uuid).first()
    if user is None:
        raise credentials_exception
        
    if user.status != "Active":
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

def require_role(allowed_roles: list[str]):
    def role_dependency(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        role = db.query(Role).filter(Role.id == current_user.role_id).first()
        if not role or role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_dependency

def require_permission(permission: str):
    def permission_dependency(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        role = db.query(Role).filter(Role.id == current_user.role_id).first()
        if role and (role.name == "Admin" or current_user.role_id == 1):
            return current_user
        role_perms = (role.permissions if role and role.permissions else [])
        if permission not in role_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}"
            )
        return current_user
    return permission_dependency
