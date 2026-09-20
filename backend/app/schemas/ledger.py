from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, Any
from app.models.ledger import TransactionType
from app.schemas.category import CategoryResponse
from app.schemas.project import ProjectResponse

class LedgerBase(BaseModel):
    type: TransactionType
    amount: float = Field(..., gt=0, description="Amount must be greater than 0")
    category_id: Optional[str] = None
    project_id: Optional[str] = None
    description: str
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    custom_metadata: Optional[str] = None
    transaction_date: date = Field(default_factory=date.today)

class LedgerCreate(LedgerBase):
    pass

class LedgerUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    category_id: Optional[str] = None
    project_id: Optional[str] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    custom_metadata: Optional[str] = None
    transaction_date: Optional[date] = None

class LedgerResponse(LedgerBase):
    id: str
    transaction_number: str
    entered_by: Any
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    project: Optional[ProjectResponse] = None

    class Config:
        orm_mode = True
        from_attributes = True
