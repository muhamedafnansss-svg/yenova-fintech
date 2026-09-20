import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.database.config import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String, ForeignKey("ledger.id"), nullable=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    file_name = Column(String, unique=True, index=True, nullable=False)
    original_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False) # in bytes
    storage_path = Column(String, nullable=False)
    document_category = Column(String, nullable=False) # Receipt, Invoice, Approval, Report, Other
    uploaded_by = Column(String, ForeignKey("users.uuid"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OCRData(Base):
    __tablename__ = "ocr_data"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, unique=True)
    vendor = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    invoice_number = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
