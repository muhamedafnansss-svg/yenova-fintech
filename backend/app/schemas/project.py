from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class ProjectBase(BaseModel):
    name: str
    project_code: str
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    coordinator_id: Optional[str] = None
    treasurer_id: Optional[str] = None
    registration_fee: Optional[float] = 0.0
    allocated_budget: Optional[float] = 0.0
    status: Optional[str] = "Planning"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    project_code: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    coordinator_id: Optional[str] = None
    treasurer_id: Optional[str] = None
    registration_fee: Optional[float] = None
    allocated_budget: Optional[float] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class ProjectFinancialSummary(BaseModel):
    allocated_budget: float
    collected: float
    spent: float
    remaining: float
    profit: float
