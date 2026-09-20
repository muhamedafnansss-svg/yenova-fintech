from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.ledger import Ledger, TransactionType, TransactionStatus
from app.models.category import Category
from app.models.project import Project
from datetime import datetime, timedelta

def get_financial_health_score(db: Session, current_balance: float, total_income: float, total_expenses: float):
    """
    Calculates a simple Financial Health Score (0-100).
    Based on:
    - Positive Cash Flow (Income > Expense) (Max 40 points)
    - Cash Reserve (Current Balance > 0) (Max 30 points)
    - Budget Adherence (Overall Spend vs Budget) (Max 30 points)
    """
    score = 0
    
    # Cash Flow (40 pts)
    if total_income > 0:
        ratio = total_expenses / total_income
        if ratio < 0.6:
            score += 40
        elif ratio < 0.8:
            score += 30
        elif ratio <= 1.0:
            score += 15
        else:
            score += 0 # Deficit
            
    # Cash Reserve (30 pts)
    # Assumes a healthy reserve is at least 10% of total expenses
    if total_expenses > 0:
        reserve_ratio = current_balance / total_expenses
        if reserve_ratio > 0.2:
            score += 30
        elif reserve_ratio > 0.1:
            score += 20
        elif current_balance > 0:
            score += 10
    elif current_balance > 0:
        score += 30
        
    # Budget Adherence (30 pts)
    # Compare project budgets to actual spend
    projects = db.query(Project).all()
    total_budget = sum(p.allocated_budget for p in projects)
    if total_budget > 0:
        budget_ratio = total_expenses / total_budget
        if budget_ratio < 0.8:
            score += 30
        elif budget_ratio <= 1.0:
            score += 20
        elif budget_ratio < 1.2:
            score += 10
    else:
        score += 30 # No budgets set, default to perfect adherence
        
    return min(100, max(0, score))

def get_health_status(score: int):
    if score >= 85: return "Excellent"
    if score >= 70: return "Good"
    if score >= 50: return "Fair"
    return "Needs Attention"

def get_monthly_trend(db: Session, months_back: int = 6):
    """
    Returns monthly income, expense, and balance for the last N months.
    Guarantees a continuous sequence of all N months for smooth charting.
    """
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    now = datetime.now()
    
    # Initialize all months in chronological order
    months = {}
    for i in range(months_back - 1, -1, -1):
        m_index = now.month - 1 - i
        y = now.year + (m_index // 12)
        m = (m_index % 12) + 1
        key = f"{month_names[m - 1]} {y}"
        months[key] = {"name": key, "Income": 0.0, "Expense": 0.0, "Balance": 0.0, "_year": y, "_month": m}
        
    earliest_item = list(months.values())[0]
    start_date = datetime(earliest_item["_year"], earliest_item["_month"], 1).date()
    
    results = db.query(
        extract('year', Ledger.transaction_date).label('year'),
        extract('month', Ledger.transaction_date).label('month'),
        Ledger.type,
        func.sum(Ledger.amount).label('total')
    ).filter(
        Ledger.transaction_date >= start_date,
        Ledger.status != TransactionStatus.VOIDED
    ).group_by(
        'year', 'month', Ledger.type
    ).order_by('year', 'month').all()
    
    for r in results:
        key = f"{month_names[int(r.month)-1]} {int(r.year)}"
        if key in months:
            if r.type == TransactionType.Income:
                months[key]["Income"] = float(r.total)
            else:
                months[key]["Expense"] = float(r.total)
                
    trend = []
    for m in months.values():
        m["Balance"] = m["Income"] - m["Expense"]
        trend.append({
            "name": m["name"],
            "Income": m["Income"],
            "Expense": m["Expense"],
            "Balance": m["Balance"]
        })
        
    return trend

def get_category_analysis(db: Session, type: TransactionType):
    """
    Returns spending/income by category (excluding voided transactions).
    Includes categorized, project-tagged, and general uncategorized transactions.
    """
    # Categorized transactions
    results = db.query(
        Category.name.label('cat_name'),
        func.sum(Ledger.amount).label('total')
    ).join(Ledger, Ledger.category_id == Category.id).filter(
        Ledger.type == type,
        Ledger.status != TransactionStatus.VOIDED
    ).group_by(Category.name).order_by(func.sum(Ledger.amount).desc()).all()
    
    data = [{"name": r.cat_name, "value": float(r.total)} for r in results if r.total and r.total > 0]
    
    # Check for transactions without category_id
    uncategorized_total = db.query(
        func.sum(Ledger.amount)
    ).filter(
        Ledger.type == type,
        Ledger.category_id == None,
        Ledger.status != TransactionStatus.VOIDED
    ).scalar() or 0.0
    
    if uncategorized_total > 0:
        data.append({"name": "General / Uncategorized", "value": float(uncategorized_total)})
        
    return data

def get_event_rankings(db: Session):
    """
    Returns ranked events based on profitability and spend.
    """
    projects = db.query(Project).all()
    stats = []
    
    for p in projects:
        income = db.query(func.sum(Ledger.amount)).filter(Ledger.project_id == p.id, Ledger.type == TransactionType.Income).scalar() or 0
        expense = db.query(func.sum(Ledger.amount)).filter(Ledger.project_id == p.id, Ledger.type == TransactionType.Expense).scalar() or 0
        
        stats.append({
            "id": p.id,
            "name": p.name,
            "budget": p.allocated_budget,
            "income": income,
            "expense": expense,
            "profit": income - expense
        })
        
    return {
        "most_profitable": sorted(stats, key=lambda x: x["profit"], reverse=True)[:3],
        "highest_expense": sorted(stats, key=lambda x: x["expense"], reverse=True)[:3]
    }
