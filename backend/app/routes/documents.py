import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.config import get_db
from app.models.user import User
from app.middleware.deps import get_current_user
from app.models.document import Document, OCRData
from app.services.storage import save_upload_file, delete_file, UPLOAD_DIR

router = APIRouter(prefix="/api/documents", tags=["documents"])

MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    transaction_id: str = Form(None),
    project_id: str = Form(None),
    document_category: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate Size (FastAPI doesn't do this easily before reading, so we check after reading or rely on proxy like Nginx)
    # Since we are reading to memory/disk, we can check file length later or rely on the limit.
    
    # Save file
    file_path = save_upload_file(file)
    
    # Get size
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE:
        delete_file(file_path)
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
        
    # Create DB entry
    doc = Document(
        original_name=file.filename,
        file_name=os.path.basename(file_path),
        file_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        storage_path=file_path,
        document_category=document_category,
        transaction_id=transaction_id,
        project_id=project_id,
        uploaded_by=current_user.uuid
    )
    
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return doc

@router.get("")
def list_documents(
    transaction_id: str = None,
    project_id: str = None,
    category: str = None,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document)
    
    if transaction_id:
        query = query.filter(Document.transaction_id == transaction_id)
    if project_id:
        query = query.filter(Document.project_id == project_id)
    if category:
        query = query.filter(Document.document_category == category)
    if search:
        query = query.filter(Document.original_name.ilike(f"%{search}%"))
        
    return query.order_by(Document.created_at.desc()).all()

from app.utils.auth import verify_access_token

@router.get("/{id}/download")
def download_document(
    id: str, 
    token: str = None,
    disposition: str = "attachment",
    db: Session = Depends(get_db)
):
    import mimetypes
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc or not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="Document not found")
        
    guessed_type, _ = mimetypes.guess_type(doc.original_name)
    media_type = doc.file_type or guessed_type or "application/octet-stream"
    clean_name = doc.original_name.replace('"', '').replace(';', '').strip()
    if not clean_name:
        clean_name = f"document_{doc.id[:8]}.pdf"
        
    disp_type = "inline" if disposition == "inline" else "attachment"

    return FileResponse(
        path=doc.storage_path, 
        filename=clean_name, 
        media_type=media_type,
        headers={
            "Content-Disposition": f'{disp_type}; filename="{clean_name}"; filename*=UTF-8\'\'{clean_name}',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.delete("/{id}")
def remove_document(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Allow deletion by admin or the user who uploaded the document
    is_admin = (current_user.role_id == 1)
    is_uploader = (doc.uploaded_by == current_user.uuid)
    if not (is_admin or is_uploader):
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")
        
    delete_file(doc.storage_path)
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}

@router.post("/ocr")
def process_ocr_mock(document_id: str = Form(...), db: Session = Depends(get_db)):
    """Mock OCR endpoint demonstrating future readiness"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    ocr_data = OCRData(
        document_id=doc.id,
        vendor="Amazon (Mocked OCR)",
        amount=1450.50,
        invoice_number="INV-2026-8899",
        confidence=0.92
    )
    db.add(ocr_data)
    db.commit()
    
    return {
        "id": ocr_data.id,
        "document_id": ocr_data.document_id,
        "vendor": ocr_data.vendor,
        "amount": ocr_data.amount,
        "invoice_number": ocr_data.invoice_number,
        "confidence": ocr_data.confidence
    }
