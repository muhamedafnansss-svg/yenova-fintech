from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, date
from app.database.config import get_db
from app.models.user import User
from app.models.ledger import Ledger, TransactionType
from app.models.notification import Notification
from app.schemas.mobile import SyncRequest, SyncResponse, NotificationResponse, MobileDashboardSummary
from app.services.balance import get_current_balance
from app.middleware.deps import get_current_user

router = APIRouter(prefix="/api/mobile", tags=["mobile"])

@router.get("/dashboard", response_model=MobileDashboardSummary)
def get_mobile_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_balance = get_current_balance(db)
    
    today = date.today()
    today_income = db.query(func.sum(Ledger.amount)).filter(
        Ledger.type == TransactionType.Income,
        func.date(Ledger.transaction_date) == today
    ).scalar() or 0.0
    
    today_expense = db.query(func.sum(Ledger.amount)).filter(
        Ledger.type == TransactionType.Expense,
        func.date(Ledger.transaction_date) == today
    ).scalar() or 0.0
    
    # Mocking pending approvals for now as Workflow module is Phase 7
    pending_approvals = 0
    
    return {
        "current_balance": current_balance,
        "today_income": today_income,
        "today_expense": today_expense,
        "pending_approvals": pending_approvals
    }

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.post("/notifications/{id}/read")
def mark_notification_read(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    db.commit()
    return {"message": "Marked as read"}

@router.post("/sync", response_model=SyncResponse)
def sync_offline_transactions(
    request: SyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    synced_count = 0
    failed_ids = []
    
    for tx in request.transactions:
        # Check if transaction already exists (idempotency)
        existing = db.query(Ledger).filter(Ledger.id == tx.id).first()
        if existing:
            synced_count += 1
            continue
            
        try:
            # Generate a unique transaction number
            prefix = "YNV"
            year = datetime.now().year
            prefix_pattern = f"{prefix}-{year}-"
            last_tx = db.query(Ledger).filter(Ledger.transaction_number.startswith(prefix_pattern)).order_by(Ledger.transaction_number.desc()).first()
            last_number = 0
            if last_tx:
                try:
                    last_number = int(last_tx.transaction_number.split("-")[-1])
                except Exception:
                    pass
            new_number = f"{prefix_pattern}{(last_number + 1):06d}"
            
            # Use original date string or fallback to today
            try:
                tx_date = datetime.strptime(tx.transaction_date, "%Y-%m-%d").date()
            except:
                tx_date = date.today()
                
            new_tx = Ledger(
                id=tx.id, # Keep original mobile ID
                transaction_number=new_number,
                type=TransactionType(tx.type),
                amount=tx.amount,
                category_id=tx.category_id,
                project_id=tx.project_id,
                description=tx.description,
                payment_method=tx.payment_method,
                reference_number=tx.reference_number,
                transaction_date=tx_date,
                entered_by=current_user.id
            )
            db.add(new_tx)
            db.commit()
            synced_count += 1
        except Exception as e:
            db.rollback()
            failed_ids.append(tx.id)
            print(f"Error syncing {tx.id}: {e}")
            
    return {
        "success": len(failed_ids) == 0,
        "synced_count": synced_count,
        "failed_ids": failed_ids
    }
