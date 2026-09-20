import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Query
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
from app.middleware.deps import get_current_user, require_permission
from app.services.audit import AuditService

router = APIRouter(prefix="/api/approvals", tags=["approvals"])

class ApprovalAction(BaseModel):
    comments: Optional[str] = ""

def serialize_request_with_details(db: Session, req: ExpenseRequest):
    cat = db.query(Category).filter(Category.id == req.category_id).first()
    proj = db.query(Project).filter(Project.id == req.event_id).first() if req.event_id else None
    user = db.query(User).filter(User.uuid == req.requested_by).first()
    
    # Get latest approval record if any
    latest_approval = db.query(Approval).filter(Approval.request_id == req.id).order_by(Approval.created_at.desc()).first()
    approver = db.query(User).filter(User.uuid == latest_approval.approver_id).first() if latest_approval else None

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
        "approval_comments": latest_approval.comments if latest_approval else None,
        "approver_name": approver.name if approver else None
    }

@router.get("/pending")
def list_pending_approvals(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("APPROVE_EXPENSE"))
):
    requests = db.query(ExpenseRequest).filter(
        ExpenseRequest.status == TransactionStatus.PENDING
    ).order_by(ExpenseRequest.created_at.desc()).all()
    
    return [serialize_request_with_details(db, req) for req in requests]

@router.get("/all")
def list_all_approvals(
    status: Optional[str] = Query(None, description="Filter by status: PENDING, APPROVED, REJECTED, ALL"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("APPROVE_EXPENSE"))
):
    query = db.query(ExpenseRequest)
    if status and status.upper() != "ALL":
        for s in TransactionStatus:
            if s.value.upper() == status.upper() or s.name.upper() == status.upper():
                query = query.filter(ExpenseRequest.status == s)
                break
                
    requests = query.order_by(ExpenseRequest.created_at.desc()).all()
    return [serialize_request_with_details(db, req) for req in requests]

@router.post("/{request_id}/approve")
def approve_request(
    request_id: str, 
    data: ApprovalAction, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("APPROVE_EXPENSE"))
):
    req = db.query(ExpenseRequest).filter(ExpenseRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Expense request not found")
    if req.status != TransactionStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Request cannot be approved because it is already {req.status.value}")
        
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
    
    # Generate unique collision-free transaction number
    unique_suffix = uuid.uuid4().hex[:4].upper()
    transaction_number = f"TRX-{datetime.now().strftime('%Y%m%d%H%M%S')}-{unique_suffix}"
    
    # Add directly into the financial ledger
    ledger_entry = Ledger(
        id=str(uuid.uuid4()),
        transaction_number=transaction_number,
        type=TransactionType.Expense,
        amount=req.amount,
        category_id=req.category_id,
        project_id=req.event_id,
        description=f"[Approved Request: {req.request_number}] {req.description}",
        entered_by=current_user.id,
        status=TransactionStatus.APPROVED
    )
    db.add(ledger_entry)
    
    AuditService.log_action(
        db=db,
        user_id=current_user.uuid,
        action="APPROVE_REQUEST",
        module="Approvals",
        entity_type="ExpenseRequest",
        entity_id=req.id,
        old_values={"status": "Pending"},
        new_values={"status": "Approved", "transaction_number": transaction_number, "comments": data.comments},
        request=request
    )
    
    db.commit()
    db.refresh(req)
    return {
        "message": f"Request {req.request_number} approved and ledger transaction {transaction_number} created",
        "request": serialize_request_with_details(db, req),
        "transaction_number": transaction_number
    }

@router.post("/{request_id}/reject")
def reject_request(
    request_id: str, 
    data: ApprovalAction, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("REJECT_EXPENSE"))
):
    req = db.query(ExpenseRequest).filter(ExpenseRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Expense request not found")
    if req.status != TransactionStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Request cannot be rejected because it is already {req.status.value}")
        
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
        module="Approvals",
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
        "request": serialize_request_with_details(db, req)
    }

@router.delete("/{request_id}")
def delete_approval_and_request(
    request_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    is_admin = (role and role.name == "Admin") or current_user.role_id == 1
    
    req = db.query(ExpenseRequest).filter(ExpenseRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Expense request not found")
        
    if not is_admin and req.requested_by != current_user.uuid:
        raise HTTPException(status_code=403, detail="Not authorized to delete this request")
        
    # Delete associated approvals
    db.query(Approval).filter(Approval.request_id == request_id).delete(synchronize_session=False)
    
    # Remove associated ledger entry if any
    matching_txs = db.query(Ledger).filter(Ledger.description.ilike(f"%{req.request_number}%")).all()
    for tx in matching_txs:
        db.delete(tx)
        
    AuditService.log_action(
        db=db,
        user_id=current_user.uuid,
        action="DELETE_REQUEST",
        module="Approvals",
        entity_type="ExpenseRequest",
        entity_id=req.id,
        old_values={"request_number": req.request_number, "status": req.status.value, "amount": req.amount},
        new_values={"deleted": True},
        request=request
    )
    
    db.delete(req)
    db.commit()
    return {"message": f"Expense request {req.request_number} deleted successfully"}
