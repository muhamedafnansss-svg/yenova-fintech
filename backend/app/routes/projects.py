from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.database.config import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectFinancialSummary
from app.services.project import get_project_summary
from app.models.user import User
from app.models.ledger import Ledger
from app.models.expense_request import ExpenseRequest
from app.models.document import Document
from app.services.audit import AuditService
from app.middleware.deps import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("", response_model=List[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).all()
    return projects

@router.get("/{id}", response_model=ProjectResponse)
def get_project(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Project).filter(Project.project_code == project_in.project_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project code already exists")
    
    db_project = Project(**project_in.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.put("/{id}", response_model=ProjectResponse)
def update_project(
    id: str,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_project = db.query(Project).filter(Project.id == id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    old_val = {"name": db_project.name, "allocated_budget": db_project.allocated_budget, "status": db_project.status}
    update_data = project_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
        
    try:
        AuditService.log_action(
            db=db,
            user_id=current_user.uuid,
            action="UPDATE_PROJECT",
            module="Projects",
            entity_type="Project",
            entity_id=id,
            old_values=old_val,
            new_values={k: str(v) if isinstance(v, (datetime, date)) else v for k, v in update_data.items()}
        )
    except Exception as e:
        print(f"Audit log warning: {e}")

    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{id}")
def delete_project(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_project = db.query(Project).filter(Project.id == id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project_name = db_project.name
    project_code = db_project.project_code

    # Unlink foreign key references cleanly to avoid constraint errors
    db.query(Ledger).filter(Ledger.project_id == id).update({"project_id": None})
    db.query(ExpenseRequest).filter(ExpenseRequest.event_id == id).update({"event_id": None})
    db.query(Document).filter(Document.project_id == id).update({"project_id": None})
    
    db.delete(db_project)
    
    AuditService.log_action(
        db=db,
        user_id=current_user.uuid,
        action="DELETE_PROJECT",
        module="Projects",
        entity_type="Project",
        entity_id=id,
        old_values={"name": project_name, "project_code": project_code},
        new_values=None
    )
    
    db.commit()
    return {"message": f"Project '{project_name}' deleted successfully", "id": id}

@router.get("/{id}/summary", response_model=ProjectFinancialSummary)
def get_summary(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = get_project_summary(db, id)
    if not summary:
        raise HTTPException(status_code=404, detail="Project not found")
    return summary
