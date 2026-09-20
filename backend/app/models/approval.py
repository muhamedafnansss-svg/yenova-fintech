import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from app.database.config import Base
from app.models.ledger import TransactionStatus

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String, ForeignKey("expense_requests.id"), nullable=False)
    approver_id = Column(String, ForeignKey("users.uuid"), nullable=False)
    approval_level = Column(Integer, default=1, nullable=False)
    status = Column(Enum(TransactionStatus), nullable=False) # APPROVED, REJECTED, PENDING
    comments = Column(Text, nullable=True)
    
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    expense_request = relationship("ExpenseRequest", back_populates="approvals")
    approver = relationship("User", foreign_keys=[approver_id])
