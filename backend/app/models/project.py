import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Date, Text, Enum
from sqlalchemy.orm import relationship
import enum
from app.database.config import Base

class ProjectStatus(str, enum.Enum):
    Planning = "Planning"
    RegistrationOpen = "Registration Open"
    Ongoing = "Ongoing"
    Active = "Active"
    Completed = "Completed"
    Archived = "Archived"
    Cancelled = "Cancelled"

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    venue = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    
    coordinator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    treasurer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    registration_fee = Column(Float, default=0.0)
    allocated_budget = Column(Float, default=0.0)
    
    status = Column(Enum(ProjectStatus), default=ProjectStatus.Planning)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    coordinator = relationship("User", foreign_keys=[coordinator_id])
    treasurer = relationship("User", foreign_keys=[treasurer_id])
    transactions = relationship("Ledger", back_populates="project")
