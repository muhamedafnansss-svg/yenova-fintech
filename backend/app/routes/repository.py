from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.config import get_db
from app.models.document import Document
from app.models.user import User
from app.middleware.deps import get_current_user

router = APIRouter(prefix="/api/repository", tags=["repository"])

@router.get("/stats")
def get_repository_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total limit mocked to 5GB (5 * 1024 * 1024 * 1024 bytes)
    TOTAL_STORAGE_LIMIT = 5368709120
    
    # Get total space used
    total_used = db.query(func.sum(Document.file_size)).scalar() or 0
    
    # Get counts by category
    categories = db.query(Document.document_category, func.count(Document.id)).group_by(Document.document_category).all()
    
    counts = {
        "Receipt": 0,
        "Invoice": 0,
        "Approval": 0,
        "Report": 0,
        "Other": 0
    }
    
    for cat, count in categories:
        counts[cat] = count
        
    total_documents = sum(counts.values())

    return {
        "storage_used": total_used,
        "storage_limit": TOTAL_STORAGE_LIMIT,
        "total_documents": total_documents,
        "category_counts": counts
    }
