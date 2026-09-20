from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.config import get_db
from app.models.opening_balance import OpeningBalance
from app.schemas.opening_balance import OpeningBalanceCreate, OpeningBalanceResponse, OpeningBalanceUpdate
from app.models.user import User
from app.middleware.deps import get_current_user
from app.services.balance import get_balance_details
from app.services.audit import AuditService

router = APIRouter(prefix="/api/opening-balance", tags=["opening_balance"])

@router.get("/current/details")
def get_current_balance_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return full live balance calculation: Starting Balance + Total Incomes - Total Expenses"""
    return get_balance_details(db)

@router.get("/{financial_year}", response_model=OpeningBalanceResponse)
def get_opening_balance(
    financial_year: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ob = db.query(OpeningBalance).filter(OpeningBalance.financial_year == financial_year).first()
    if not ob:
        # Check if there is any existing opening balance we can return as fallback
        ob = db.query(OpeningBalance).order_by(OpeningBalance.created_at.desc()).first()
        if not ob:
            raise HTTPException(status_code=404, detail="Opening balance not found for this financial year")
    return ob

@router.post("", response_model=OpeningBalanceResponse)
def set_opening_balance(
    ob_in: OpeningBalanceCreate,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Set or update the starting / opening financial balance.
    The starting balance is the baseline from which all incomes are added and expenses subtracted.
    """
    existing = db.query(OpeningBalance).filter(OpeningBalance.financial_year == ob_in.financial_year).first()
    
    if existing:
        old_val = existing.opening_balance
        existing.opening_balance = ob_in.opening_balance
        existing.created_by = current_user.id
        existing.created_at = datetime.utcnow()
        
        AuditService.log_action(
            db=db,
            user_id=current_user.id,
            action="UPDATE_STARTING_BALANCE",
            module="Financial",
            entity_type="OpeningBalance",
            entity_id=existing.id,
            old_values={"opening_balance": old_val, "financial_year": existing.financial_year},
            new_values={"opening_balance": ob_in.opening_balance, "financial_year": ob_in.financial_year},
            request=request
        )
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_ob = OpeningBalance(
            financial_year=ob_in.financial_year,
            opening_balance=ob_in.opening_balance,
            created_by=current_user.id,
            created_at=datetime.utcnow()
        )
        db.add(new_ob)
        AuditService.log_action(
            db=db,
            user_id=current_user.id,
            action="SET_STARTING_BALANCE",
            module="Financial",
            entity_type="OpeningBalance",
            entity_id=new_ob.id,
            old_values=None,
            new_values={"opening_balance": ob_in.opening_balance, "financial_year": ob_in.financial_year},
            request=request
        )
        db.commit()
        db.refresh(new_ob)
        return new_ob

@router.put("/{financial_year}", response_model=OpeningBalanceResponse)
def update_opening_balance(
    financial_year: str,
    ob_in: OpeningBalanceUpdate,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update opening balance for a specific financial year."""
    existing = db.query(OpeningBalance).filter(OpeningBalance.financial_year == financial_year).first()
    if not existing:
        new_ob = OpeningBalance(
            financial_year=financial_year,
            opening_balance=ob_in.opening_balance or 0.0,
            created_by=current_user.id,
            created_at=datetime.utcnow()
        )
        db.add(new_ob)
        db.commit()
        db.refresh(new_ob)
        return new_ob
        
    old_val = existing.opening_balance
    if ob_in.opening_balance is not None:
        existing.opening_balance = ob_in.opening_balance
    existing.created_by = current_user.id
    existing.created_at = datetime.utcnow()
    
    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        action="UPDATE_STARTING_BALANCE",
        module="Financial",
        entity_type="OpeningBalance",
        entity_id=existing.id,
        old_values={"opening_balance": old_val},
        new_values={"opening_balance": existing.opening_balance},
        request=request
    )
    db.commit()
    db.refresh(existing)
    return existing

