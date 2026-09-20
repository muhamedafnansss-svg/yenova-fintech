import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models.role import Role

def seed_permissions():
    db = SessionLocal()
    try:
        roles = db.query(Role).all()
        for role in roles:
            if role.name == "Admin":
                role.permissions = [
                    "VIEW_LEDGER", "CREATE_INCOME", "CREATE_EXPENSE", "EDIT_EXPENSE", "DELETE_EXPENSE",
                    "APPROVE_EXPENSE", "REJECT_EXPENSE", "VERIFY_TRANSACTION", "MANAGE_EVENTS",
                    "MANAGE_BUDGET", "VIEW_REPORTS", "EXPORT_REPORTS", "MANAGE_DOCUMENTS",
                    "VIEW_AUDIT_LOG", "MANAGE_USERS", "VOID_TRANSACTION"
                ]
            elif role.name == "Treasurer":
                role.permissions = [
                    "VIEW_LEDGER", "CREATE_INCOME", "CREATE_EXPENSE", "EDIT_EXPENSE",
                    "APPROVE_EXPENSE", "REJECT_EXPENSE", "VERIFY_TRANSACTION",
                    "VIEW_REPORTS", "EXPORT_REPORTS", "MANAGE_DOCUMENTS", "VOID_TRANSACTION"
                ]
            elif role.name == "President":
                role.permissions = [
                    "VIEW_LEDGER", "APPROVE_EXPENSE", "REJECT_EXPENSE", "VIEW_REPORTS", "EXPORT_REPORTS",
                    "VIEW_AUDIT_LOG", "MANAGE_EVENTS", "MANAGE_BUDGET"
                ]
            elif role.name == "Faculty Coordinator":
                role.permissions = [
                    "VIEW_LEDGER", "VIEW_REPORTS", "EXPORT_REPORTS", "APPROVE_EXPENSE", "REJECT_EXPENSE", "VIEW_AUDIT_LOG"
                ]
            elif role.name == "Member":
                role.permissions = [
                    "VIEW_LEDGER", "SUBMIT_EXPENSE_REQUEST"
                ]
            else:
                role.permissions = []
                
        db.commit()
        print("Permissions seeded successfully!")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_permissions()
