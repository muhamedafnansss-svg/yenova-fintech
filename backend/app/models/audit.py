import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database.config import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.uuid"), nullable=False)
    action = Column(String, nullable=False) # e.g., "CREATE_TRANSACTION", "APPROVE_REQUEST"
    module = Column(String, nullable=False) # e.g., "Ledger", "Approvals"
    entity_type = Column(String, nullable=False) # e.g., "Transaction", "ExpenseRequest"
    entity_id = Column(String, nullable=False)
    
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
