import uuid
from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.orm import relationship
from app.database.config import Base
from app.models.ledger import TransactionType # We can import from ledger, but wait, circular import.

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True)
    type = Column(String, nullable=False) # 'Income' or 'Expense'
    color = Column(String, nullable=True, default="#10B981")
    icon = Column(String, nullable=True, default="tag")
    is_active = Column(Boolean, default=True)

    transactions = relationship("Ledger", back_populates="category")
