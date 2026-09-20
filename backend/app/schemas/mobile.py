from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SyncTransaction(BaseModel):
    id: str
    type: str
    amount: float
    category_id: Optional[str] = None
    project_id: Optional[str] = None
    description: str
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    transaction_date: str
    
class SyncRequest(BaseModel):
    transactions: List[SyncTransaction]

class SyncResponse(BaseModel):
    success: bool
    synced_count: int
    failed_ids: List[str]

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    read: bool
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class MobileDashboardSummary(BaseModel):
    current_balance: float
    today_income: float
    today_expense: float
    pending_approvals: int
