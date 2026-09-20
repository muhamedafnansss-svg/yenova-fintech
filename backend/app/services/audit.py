import uuid
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from fastapi import Request

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        user_id: str,
        action: str,
        module: str,
        entity_type: str,
        entity_id: str,
        old_values: dict = None,
        new_values: dict = None,
        request: Request = None
    ):
        ip_address = None
        user_agent = None
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

        audit_entry = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            module=module,
            entity_type=entity_type,
            entity_id=str(entity_id),
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(audit_entry)
        # We don't commit here so that the audit log is committed in the same transaction as the action itself.
