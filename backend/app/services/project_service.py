from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import List, Project, UserSettings


DEFAULT_PICKABLE_TITLE = "Pickable List"
DEFAULT_PICKED_TITLE = "Picked List"


def create_project(db: Session, title: str) -> Project:
    project = Project(title=title)
    db.add(project)
    db.flush()
    db.add_all(
        [
            List(project_id=project.id, title=DEFAULT_PICKABLE_TITLE, kind="pickable"),
            List(project_id=project.id, title=DEFAULT_PICKED_TITLE, kind="picked"),
        ]
    )
    db.commit()
    db.refresh(project)
    return project


def rename_project(db: Session, project_id: int, title: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise ValueError("Project not found")
    project.title = title.strip() or project.title
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int) -> None:
    project = db.get(Project, project_id)
    if project is None:
        raise ValueError("Project not found")
    db.delete(project)

    settings = db.scalar(select(UserSettings).where(UserSettings.id == 1))
    if settings and settings.last_project_id == project_id:
        settings.last_project_id = None
    db.commit()


def get_user_settings(db: Session) -> UserSettings:
    settings = db.scalar(select(UserSettings).where(UserSettings.id == 1))
    if settings is None:
        settings = UserSettings(id=1, last_project_id=None)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def set_last_project(db: Session, project_id: int | None) -> UserSettings:
    settings = get_user_settings(db)
    if project_id is not None and db.get(Project, project_id) is None:
        raise ValueError("Project not found")
    settings.last_project_id = project_id
    db.commit()
    db.refresh(settings)
    return settings
