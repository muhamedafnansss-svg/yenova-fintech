import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.config import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.utils.auth import get_password_hash

db = SessionLocal()

def seed_data():
    # Roles
    admin_perms = [
        "VIEW_LEDGER", "CREATE_INCOME", "CREATE_EXPENSE", "EDIT_EXPENSE", "DELETE_EXPENSE", 
        "APPROVE_EXPENSE", "REJECT_EXPENSE", "VERIFY_TRANSACTION", "MANAGE_EVENTS", 
        "MANAGE_BUDGET", "VIEW_REPORTS", "EXPORT_REPORTS", "MANAGE_DOCUMENTS", 
        "VIEW_AUDIT_LOG", "MANAGE_USERS", "VOID_TRANSACTION", "VIEW_DASHBOARD"
    ]
    member_perms = ["VIEW_LEDGER", "CREATE_INCOME", "SUBMIT_EXPENSE_REQUEST", "VIEW_DASHBOARD"]

    admin_role = db.query(Role).filter(Role.name == "Admin").first()
    if not admin_role:
        admin_role = Role(name="Admin", description="Full access", permissions=admin_perms)
        db.add(admin_role)
    else:
        admin_role.permissions = admin_perms
    
    member_role = db.query(Role).filter(Role.name == "Member").first()
    if not member_role:
        member_role = Role(name="Member", description="Member access", permissions=member_perms)
        db.add(member_role)
    else:
        member_role.permissions = member_perms
        
    db.commit()
    db.refresh(admin_role)
    
    # Admin User
    admin = db.query(User).filter(User.email == "admin@fintech.com").first()
    if not admin:
        admin = User(
            email="admin@fintech.com",
            password_hash=get_password_hash("admin123"),
            name="Admin User",
            role_id=admin_role.id
        )
        db.add(admin)
        
    db.commit()
    print("Database seeded successfully with admin user: admin@fintech.com / admin123")

if __name__ == "__main__":
    seed_data()
