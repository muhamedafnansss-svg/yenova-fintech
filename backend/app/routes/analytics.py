from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.database.config import get_db
from app.models.user import User
from app.middleware.deps import get_current_user
from app.models.ledger import Ledger, TransactionType, TransactionStatus
from app.models.project import Project
from app.services.balance import get_current_balance
from app.services.analytics_engine import (
    get_financial_health_score,
    get_health_status,
    get_monthly_trend,
    get_category_analysis,
    get_event_rankings
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_balance = get_current_balance(db)
    total_income = db.query(func.sum(Ledger.amount)).filter(Ledger.type == TransactionType.Income, Ledger.status != TransactionStatus.VOIDED).scalar() or 0.0
    total_expenses = db.query(func.sum(Ledger.amount)).filter(Ledger.type == TransactionType.Expense, Ledger.status != TransactionStatus.VOIDED).scalar() or 0.0
    
    events_count = db.query(Project).count()
    tx_count = db.query(Ledger).count()
    
    health_score = get_financial_health_score(db, current_balance, total_income, total_expenses)
    
    return {
        "current_balance": current_balance,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_surplus": current_balance,
        "events_conducted": events_count,
        "transactions_count": tx_count,
        "health_score": health_score,
        "health_status": get_health_status(health_score)
    }

@router.get("/categories")
def get_analytics_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {
        "income": get_category_analysis(db, TransactionType.Income),
        "expense": get_category_analysis(db, TransactionType.Expense)
    }

@router.get("/events")
def get_analytics_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_event_rankings(db)

@router.get("/cashflow")
def get_analytics_cashflow(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_monthly_trend(db, months_back=months)
