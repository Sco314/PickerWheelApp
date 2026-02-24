from sqlalchemy.orm import Session

from app.db.models import List, Project


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
