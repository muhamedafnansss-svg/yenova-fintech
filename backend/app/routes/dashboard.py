from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.database.config import get_db
from app.models.ledger import Ledger, TransactionType, TransactionStatus
from app.schemas.ledger import LedgerResponse
from app.services.balance import get_current_balance, get_balance_details
from app.models.user import User
from app.middleware.deps import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    balance_info = get_balance_details(db)
    current_balance = balance_info["current_balance"]
    opening_balance = balance_info["opening_balance"]
    financial_year = balance_info["financial_year"]
    
    total_income = balance_info["total_income"]
    total_expenses = balance_info["total_expenses"]
    
    today = datetime.now().date()
    today_transactions_count = db.query(Ledger).filter(
        Ledger.transaction_date == today,
        Ledger.status != TransactionStatus.VOIDED
    ).count()
    
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    this_month_income = db.query(func.sum(Ledger.amount)).filter(
        Ledger.type == TransactionType.Income,
        Ledger.status != TransactionStatus.VOIDED,
        func.extract('month', Ledger.transaction_date) == current_month,
        func.extract('year', Ledger.transaction_date) == current_year
    ).scalar() or 0.0
    
    this_month_expense = db.query(func.sum(Ledger.amount)).filter(
        Ledger.type == TransactionType.Expense,
        Ledger.status != TransactionStatus.VOIDED,
        func.extract('month', Ledger.transaction_date) == current_month,
        func.extract('year', Ledger.transaction_date) == current_year
    ).scalar() or 0.0
    
    return {
        "current_balance": current_balance,
        "opening_balance": opening_balance,
        "financial_year": financial_year,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "today_transactions": today_transactions_count,
        "this_month_income": this_month_income,
        "this_month_expense": this_month_expense
    }

from sqlalchemy.orm import joinedload

@router.get("/recent-transactions", response_model=List[LedgerResponse])
def get_recent_transactions(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transactions = db.query(Ledger).options(joinedload(Ledger.category), joinedload(Ledger.project)).order_by(Ledger.transaction_date.desc(), Ledger.created_at.desc()).limit(limit).all()
    return transactions
