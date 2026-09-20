from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any

from app.database.config import get_db
from app.models.user import User
from app.middleware.deps import get_current_user
from app.models.ledger import Ledger, TransactionType
from app.models.project import Project

router = APIRouter(prefix="/api/reports", tags=["reports"])

def get_report_data(db: Session, start_date: datetime, end_date: datetime):
    transactions = db.query(Ledger).filter(
        Ledger.transaction_date >= start_date.date(),
        Ledger.transaction_date <= end_date.date()
    ).all()
    
    income = sum(t.amount for t in transactions if t.type == TransactionType.Income)
    expense = sum(t.amount for t in transactions if t.type == TransactionType.Expense)
    
    return {
        "period_start": start_date.date().isoformat(),
        "period_end": end_date.date().isoformat(),
        "total_income": income,
        "total_expense": expense,
        "net_profit": income - expense,
        "transaction_count": len(transactions),
        "transactions": [
            {
                "id": t.id,
                "date": t.transaction_date.isoformat(),
                "type": t.type.value,
                "amount": t.amount,
                "description": t.description
            } for t in transactions
        ]
    }

@router.get("/daily")
def get_daily_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.now()
    return get_report_data(db, today, today)

@router.get("/weekly")
def get_weekly_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday())
    return get_report_data(db, start_of_week, today)

@router.get("/monthly")
def get_monthly_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.now()
    start_of_month = today.replace(day=1)
    return get_report_data(db, start_of_month, today)

@router.get("/yearly")
def get_yearly_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.now()
    # Assuming Academic Year starts June 1st (common in India)
    if today.month < 6:
        start_date = today.replace(year=today.year-1, month=6, day=1)
    else:
        start_date = today.replace(month=6, day=1)
    return get_report_data(db, start_date, today)

@router.get("/event/{project_id}")
def get_event_report(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return {"error": "Project not found"}
        
    transactions = db.query(Ledger).filter(Ledger.project_id == project_id).all()
    
    income = sum(t.amount for t in transactions if t.type == TransactionType.Income)
    expense = sum(t.amount for t in transactions if t.type == TransactionType.Expense)
    
    return {
        "event_name": project.name,
        "event_code": project.project_code,
        "allocated_budget": project.allocated_budget,
        "total_collected": income,
        "total_spent": expense,
        "net_profit": income - expense,
        "transaction_count": len(transactions),
        "transactions": [
            {
                "id": t.id,
                "date": t.transaction_date.isoformat(),
                "type": t.type.value,
                "amount": t.amount,
                "description": t.description
            } for t in transactions
        ]
    }
