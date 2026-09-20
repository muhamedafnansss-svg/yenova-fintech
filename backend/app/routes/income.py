from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database.config import get_db
from app.models.ledger import Ledger, TransactionType
from app.schemas.ledger import LedgerResponse, LedgerCreate, LedgerUpdate
from app.services.ledger import create_ledger_entry
from app.models.user import User
from app.middleware.deps import get_current_user

router = APIRouter(prefix="/api/income", tags=["income"])

@router.get("", response_model=List[LedgerResponse])
def get_incomes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incomes = db.query(Ledger).filter(Ledger.type == TransactionType.Income).offset(skip).limit(limit).all()
    return incomes

@router.post("", response_model=LedgerResponse)
def create_income(
    income_in: LedgerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if income_in.type != TransactionType.Income:
        raise HTTPException(status_code=400, detail="Type must be Income")
    return create_ledger_entry(db, income_in, current_user.id)

@router.put("/{id}", response_model=LedgerResponse)
def update_income(
    id: str,
    income_in: LedgerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_income = db.query(Ledger).filter(Ledger.id == id, Ledger.type == TransactionType.Income).first()
    if not db_income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    update_data = income_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_income, key, value)
        
    db.commit()
    db.refresh(db_income)
    return db_income

@router.delete("/{id}")
def delete_income(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_income = db.query(Ledger).filter(Ledger.id == id, Ledger.type == TransactionType.Income).first()
    if not db_income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    db.delete(db_income)
    db.commit()
    return {"message": "Income deleted successfully"}
