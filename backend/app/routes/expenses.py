from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.config import get_db
from app.models.ledger import Ledger, TransactionType
from app.schemas.ledger import LedgerResponse, LedgerCreate, LedgerUpdate
from app.services.ledger import create_ledger_entry
from app.models.user import User
from app.middleware.deps import get_current_user, require_permission

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

@router.get("", response_model=List[LedgerResponse])
def get_expenses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expenses = db.query(Ledger).filter(Ledger.type == TransactionType.Expense).offset(skip).limit(limit).all()
    return expenses

@router.post("", response_model=LedgerResponse)
def create_expense(
    expense_in: LedgerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("CREATE_EXPENSE"))
):
    if expense_in.type != TransactionType.Expense:
        raise HTTPException(status_code=400, detail="Type must be Expense")
    return create_ledger_entry(db, expense_in, current_user.id)

@router.put("/{id}", response_model=LedgerResponse)
def update_expense(
    id: str,
    expense_in: LedgerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("EDIT_EXPENSE"))
):
    db_expense = db.query(Ledger).filter(Ledger.id == id, Ledger.type == TransactionType.Expense).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = expense_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
        
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{id}")
def delete_expense(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DELETE_EXPENSE"))
):
    db_expense = db.query(Ledger).filter(Ledger.id == id, Ledger.type == TransactionType.Expense).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted successfully"}
