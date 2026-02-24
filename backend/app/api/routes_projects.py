from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Project
from app.db.session import get_db
from app.schemas.project import ProjectCreate, ProjectOut
from app.services.project_service import create_project

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return list(db.scalars(select(Project).order_by(Project.id.desc())))


@router.post("", response_model=ProjectOut)
def add_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    return create_project(db, payload.title)
