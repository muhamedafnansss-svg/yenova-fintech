from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.models.ledger import Ledger, TransactionType, TransactionStatus
from app.models.opening_balance import OpeningBalance

def get_balance_details(db: Session, financial_year: str = None) -> dict:
    """
    Get full balance breakdown:
    Current Balance = (Opening Balance / Starting Balance set by user) + Total Income - Total Expense
    """
    query = db.query(OpeningBalance)
    if financial_year:
        opening = query.filter(OpeningBalance.financial_year == financial_year).first()
    else:
        # Check current year first, fallback to the latest opening balance record
        opening = query.filter(OpeningBalance.financial_year == "2026-2027").first()
        if not opening:
            opening = query.order_by(OpeningBalance.created_at.desc()).first()

    opening_amount = float(opening.opening_balance) if opening else 0.0
    fy_label = opening.financial_year if opening else "2026-2027"

    total_income = float(db.query(func.sum(Ledger.amount)).filter(
        Ledger.type == TransactionType.Income,
        Ledger.status != TransactionStatus.VOIDED
    ).scalar() or 0.0)

    total_expense = float(db.query(func.sum(Ledger.amount)).filter(
        Ledger.type == TransactionType.Expense,
        Ledger.status != TransactionStatus.VOIDED
    ).scalar() or 0.0)

    current_balance = opening_amount + total_income - total_expense

    return {
        "financial_year": fy_label,
        "opening_balance": opening_amount,
        "total_income": total_income,
        "total_expenses": total_expense,
        "current_balance": current_balance
    }

def get_current_balance(db: Session, financial_year: str = None) -> float:
    details = get_balance_details(db, financial_year)
    return details["current_balance"]

