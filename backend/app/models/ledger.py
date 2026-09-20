import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Date, Text, Enum
from sqlalchemy.orm import relationship
import enum
from app.database.config import Base

class TransactionType(str, enum.Enum):
    Income = "Income"
    Expense = "Expense"

class TransactionStatus(str, enum.Enum):
    DRAFT = "Draft"
    PENDING = "Pending"
    APPROVED = "Approved"
    VERIFIED = "Verified"
    COMPLETED = "Completed"
    VOIDED = "Voided"
    REJECTED = "Rejected"

class Ledger(Base):
    __tablename__ = "ledger"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_number = Column(String, unique=True, index=True, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.COMPLETED, nullable=False)
    amount = Column(Float, nullable=False)
    
    # Phase 3: Relationships with Projects and Categories
    category_id = Column(String, ForeignKey("categories.id"), nullable=True) # Making nullable true to avoid migration issues with existing data temporarily
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    
    description = Column(Text, nullable=False)
    payment_method = Column(String, nullable=True)
    reference_number = Column(String, nullable=True)
    custom_metadata = Column(Text, nullable=True)
    
    entered_by = Column(String, ForeignKey("users.id"), nullable=False)
    transaction_date = Column(Date, default=date.today, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    project = relationship("Project", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
