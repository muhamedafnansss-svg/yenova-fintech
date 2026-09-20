import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models.user import User
from app.utils.auth import get_password_hash
from app.models.role import Role

db = SessionLocal()
try:
    role = db.query(Role).filter(Role.name == "Admin").first()
    if not role:
        role = Role(name="Admin")
        db.add(role)
        db.commit()
        
    user = db.query(User).filter(User.email == "admin@yenova.com").first()
    if not user:
        user = User(email="admin@yenova.com", role_id=role.id, name="Admin User")
        db.add(user)
    else:
        user.role_id = role.id
    user.password_hash = get_password_hash("Admin@123")
    db.commit()
    print("Admin user updated successfully.")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
