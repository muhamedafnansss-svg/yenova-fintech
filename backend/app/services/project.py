from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ledger import Ledger, TransactionType
from app.models.project import Project

def get_project_summary(db: Session, project_id: str):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None
        
    collected = db.query(func.sum(Ledger.amount)).filter(
        Ledger.project_id == project_id,
        Ledger.type == TransactionType.Income
    ).scalar() or 0.0
    
    spent = db.query(func.sum(Ledger.amount)).filter(
        Ledger.project_id == project_id,
        Ledger.type == TransactionType.Expense
    ).scalar() or 0.0
    
    remaining = project.allocated_budget - spent
    profit = collected - spent
    
    return {
        "allocated_budget": project.allocated_budget,
        "collected": collected,
        "spent": spent,
        "remaining": remaining,
        "profit": profit
    }
