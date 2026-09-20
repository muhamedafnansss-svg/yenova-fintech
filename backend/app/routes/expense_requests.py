import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.config import get_db
from app.models.user import User
from app.models.role import Role
from app.models.expense_request import ExpenseRequest
from app.models.approval import Approval
from app.models.ledger import Ledger, TransactionStatus, TransactionType
from app.models.category import Category
from app.models.project import Project
from app.models.document import Document
from app.middleware.deps import get_current_user, require_permission
from app.services.audit import AuditService

router = APIRouter(prefix="/api/expense-requests", tags=["expense-requests"])

class ExpenseRequestCreate(BaseModel):
    category_id: str
    event_id: Optional[str] = None
    amount: float
    description: str

class ExpenseRequestAction(BaseModel):
    comments: Optional[str] = ""

def serialize_request(db: Session, req: ExpenseRequest):
    cat = db.query(Category).filter(Category.id == req.category_id).first()
    proj = db.query(Project).filter(Project.id == req.event_id).first() if req.event_id else None
    user = db.query(User).filter(User.uuid == req.requested_by).first()
    latest_app = db.query(Approval).filter(Approval.request_id == req.id).order_by(Approval.created_at.desc()).first()
    approver = db.query(User).filter(User.uuid == latest_app.approver_id).first() if latest_app else None
    
    return {
        "id": req.id,
        "request_number": req.request_number,
        "amount": req.amount,
        "description": req.description,
        "status": req.status.value if hasattr(req.status, "value") else str(req.status),
        "category_id": req.category_id,
        "category_name": cat.name if cat else "General",
        "event_id": req.event_id,
        "project_name": proj.name if proj else None,
        "requested_by": req.requested_by,
        "requested_by_name": user.name if user else "Member",
        "created_at": req.created_at,
        "submitted_at": req.submitted_at,
        "approved_at": req.approved_at,
        "rejected_at": req.rejected_at,
        "approval_comments": latest_app.comments if latest_app else None,
        "approver_name": approver.name if approver else None
    }

@router.post("")
def create_expense_request(
    data: ExpenseRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("SUBMIT_EXPENSE_REQUEST"))
):
    unique_suffix = uuid.uuid4().hex[:4].upper()
    request_number = f"REQ-{datetime.now().strftime('%Y%m%d%H%M%S')}-{unique_suffix}"
    
    req = ExpenseRequest(
        id=str(uuid.uuid4()),
        request_number=request_number,
        requested_by=current_user.uuid,
        category_id=data.category_id,
        event_id=data.event_id,
        amount=data.amount,
        description=data.description,
        status=TransactionStatus.PENDING
    )
    db.add(req)
    
    AuditService.log_action(
        db=db,
        user_id=current_user.uuid,
        action="CREATE_REQUEST",
        module="ExpenseRequests",
        entity_type="ExpenseRequest",
        entity_id=req.id,
        new_values={"amount": data.amount, "description": data.description, "request_number": request_number},
        request=request
    )
    
    db.commit()
    db.refresh(req)
    return serialize_request(db, req)

@router.get("")
def list_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    is_admin = (user_role and user_role.name == "Admin") or current_user.role_id == 1
    has_approve_perm = is_admin or (user_role and "APPROVE_EXPENSE" in (user_role.permissions or []))
    
    query = db.query(ExpenseRequest)
    if not has_approve_perm:
        query = query.filter(ExpenseRequest.requested_by == current_user.uuid)
        
    requests = query.order_by(ExpenseRequest.created_at.desc()).all()
    return [serialize_request(db, req) for req in requests]

@router.get("/{id}")
def get_request(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = db.query(ExpenseRequest).filter(ExpenseRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return serialize_request(db, req)

@router.post("/{id}/approve")
def approve_expense_request(
    id: str,
    data: ExpenseRequestAction,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("APPROVE_EXPENSE"))
):
    req = db.query(ExpenseRequest).filter(ExpenseRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Expense request not found")
    if req.status != TransactionStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Request is already {req.status.value}")
        
    now = datetime.now(timezone.utc)
    req.status = TransactionStatus.APPROVED
    req.approved_at = now
    
    approval = Approval(
        id=str(uuid.uuid4()),
        request_id=req.id,
        approver_id=current_user.uuid,
        status=TransactionStatus.APPROVED,
        comments=data.comments or "Approved by administrator",
        approved_at=now
    )
    db.add(approval)
    
    unique_suffix = uuid.uuid4().hex[:4].upper()
    transaction_number = f"TRX-{datetime.now().strftime('%Y%m%d%H%M%S')}-{unique_suffix}"
    
    ledger_entry = Ledger(
        id=str(uuid.uuid4()),
        transaction_number=transaction_number,
        type=TransactionType.Expense,
        amount=req.amount,
        category_id=req.category_id,
        project_id=req.event_id,
        description=f"[Approved Request: {req.request_number}] {req.description}",
        entered_by=str(current_user.id),
        status=TransactionStatus.APPROVED
    )
    db.add(ledger_entry)
    
    AuditService.log_action(
        db=db,
        user_id=current_user.uuid,
        action="APPROVE_REQUEST",
        module="ExpenseRequests",
        entity_type="ExpenseRequest",
        entity_id=req.id,
        old_values={"status": "Pending"},
        new_values={"status": "Approved", "transaction_number": transaction_number, "comments": data.comments},
        request=request
    )
    
    db.commit()
    db.refresh(req)
    return {
        "message": f"Request {req.request_number} approved and entered into ledger",
        "request": serialize_request(db, req),
        "transaction_number": transaction_number
    }

@router.post("/{id}/reject")
def reject_expense_request(
    id: str,
    data: ExpenseRequestAction,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("REJECT_EXPENSE"))
):
    req = db.query(ExpenseRequest).filter(ExpenseRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Expense request not found")
    if req.status != TransactionStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Request is already {req.status.value}")
        
    now = datetime.now(timezone.utc)
    req.status = TransactionStatus.REJECTED
    req.rejected_at = now
    
    approval = Approval(
        id=str(uuid.uuid4()),
        request_id=req.id,
        approver_id=current_user.uuid,
        status=TransactionStatus.REJECTED,
        comments=data.comments or "Rejected by administrator",
        approved_at=now
    )
    db.add(approval)
    
    AuditService.log_action(
        db=db,
        user_id=current_user.uuid,
        action="REJECT_REQUEST",
        module="ExpenseRequests",
        entity_type="ExpenseRequest",
        entity_id=req.id,
        old_values={"status": "Pending"},
        new_values={"status": "Rejected", "comments": data.comments},
        request=request
    )
    
    db.commit()
    db.refresh(req)
    return {
        "message": f"Request {req.request_number} rejected",
        "request": serialize_request(db, req)
    }

@router.delete("/{id}")
def delete_request(
    id: str, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    req = db.query(ExpenseRequest).filter(ExpenseRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Expense request not found")
        
    user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    is_admin = (user_role and user_role.name == "Admin") or current_user.role_id == 1
    
    if not is_admin and req.requested_by != current_user.uuid:
        raise HTTPException(status_code=403, detail="Not authorized to delete this request")
        
    if not is_admin and req.status != TransactionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be cancelled by members")
        
    # Delete associated approval records first
    db.query(Approval).filter(Approval.request_id == id).delete(synchronize_session=False)
    
    # Remove any corresponding ledger entries that were generated upon approval
    matching_txs = db.query(Ledger).filter(Ledger.description.ilike(f"%{req.request_number}%")).all()
    for tx in matching_txs:
        db.query(Document).filter(Document.transaction_id == tx.id).update({"transaction_id": None})
        db.delete(tx)
        
    AuditService.log_action(
        db=db,
        user_id=current_user.uuid,
        action="DELETE_REQUEST",
        module="ExpenseRequests",
        entity_type="ExpenseRequest",
        entity_id=req.id,
        old_values={"request_number": req.request_number, "status": req.status.value, "amount": req.amount},
        new_values={"deleted": True},
        request=request
    )
    
    db.delete(req)
    db.commit()
    return {"message": f"Expense request {req.request_number} removed successfully"}
