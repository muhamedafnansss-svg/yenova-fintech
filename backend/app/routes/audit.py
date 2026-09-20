from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.config import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.middleware.deps import require_permission

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("")
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("VIEW_AUDIT_LOG"))
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    result = []
    for log in logs:
        user = db.query(User).filter(User.uuid == log.user_id).first()
        result.append({
            "id": log.id,
            "user_name": user.name if user else "System",
            "action": log.action,
            "module": log.module,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "created_at": log.created_at
        })
    return result
