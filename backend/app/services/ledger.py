from sqlalchemy.orm import Session
from app.models.ledger import Ledger, TransactionType
from app.schemas.ledger import LedgerCreate
from app.services.balance import get_current_balance
from fastapi import HTTPException
from datetime import datetime

def generate_transaction_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"YNV-{year}-"
    last_tx = db.query(Ledger).filter(Ledger.transaction_number.startswith(prefix)).order_by(Ledger.transaction_number.desc()).first()
    if last_tx:
        last_num = int(last_tx.transaction_number.split("-")[-1])
        next_num = last_num + 1
    else:
        next_num = 1
    return f"{prefix}{next_num:06d}"

def create_ledger_entry(db: Session, ledger_in: LedgerCreate, user_id: str):
    if ledger_in.type == TransactionType.Expense:
        # Check balance
        current_balance = get_current_balance(db)
        if ledger_in.amount > current_balance:
            raise HTTPException(status_code=400, detail="Insufficient Available Balance")

    transaction_number = generate_transaction_number(db)
    
    db_ledger = Ledger(
        **ledger_in.dict(),
        transaction_number=transaction_number,
        entered_by=user_id
    )
    
    db.add(db_ledger)
    db.commit()
    db.refresh(db_ledger)
    return db_ledger
