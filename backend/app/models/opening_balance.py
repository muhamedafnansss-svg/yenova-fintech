import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.config import Base

class OpeningBalance(Base):
    __tablename__ = "opening_balances"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    financial_year = Column(String, unique=True, index=True, nullable=False) # e.g., "2026-2027"
    opening_balance = Column(Float, nullable=False)
    
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
