import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from app.database.config import Base
from app.models.ledger import TransactionStatus
from app.models.approval import Approval

class ExpenseRequest(Base):
    __tablename__ = "expense_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    request_number = Column(String, unique=True, index=True, nullable=False)
    requested_by = Column(String, ForeignKey("users.uuid"), nullable=False)
    event_id = Column(String, ForeignKey("projects.id"), nullable=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    requester = relationship("User", foreign_keys=[requested_by])
    project = relationship("Project")
    category = relationship("Category")
    approvals = relationship("Approval", back_populates="expense_request", cascade="all, delete-orphan")
