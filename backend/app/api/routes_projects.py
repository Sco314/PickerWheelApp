from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Project
from app.db.session import get_db
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate, UserSettingsUpdate
from app.services.project_service import (
    create_project,
    delete_project,
    get_user_settings,
    rename_project,
    set_last_project,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return list(db.scalars(select(Project).order_by(Project.id.desc())))


@router.post("", response_model=ProjectOut)
def add_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    return create_project(db, payload.title)


@router.patch("/{project_id}", response_model=ProjectOut)
def patch_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    try:
        return rename_project(db, project_id, payload.title)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{project_id}")
def remove_project(project_id: int, db: Session = Depends(get_db)):
    try:
        delete_project(db, project_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": "ok"}


@router.get("/settings")
def read_settings(db: Session = Depends(get_db)):
    settings = get_user_settings(db)
    return {"last_project_id": settings.last_project_id}


@router.patch("/settings")
def update_settings(payload: UserSettingsUpdate, db: Session = Depends(get_db)):
    try:
        settings = set_last_project(db, payload.last_project_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"last_project_id": settings.last_project_id}
