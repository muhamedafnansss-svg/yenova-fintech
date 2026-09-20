from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any

class OpeningBalanceBase(BaseModel):
    financial_year: str
    opening_balance: float

class OpeningBalanceCreate(OpeningBalanceBase):
    pass

class OpeningBalanceUpdate(BaseModel):
    opening_balance: Optional[float] = None

class OpeningBalanceResponse(OpeningBalanceBase):
    id: str
    created_by: Any
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
