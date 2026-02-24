from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.classroom_service import import_classroom_roster, upsert_alias

router = APIRouter(prefix="/classroom", tags=["classroom"])


@router.post("/{project_id}/aliases")
def save_alias(project_id: int, payload: dict, db: Session = Depends(get_db)):
    upsert_alias(db, project_id, payload["external_id"], payload["alias_name"])
    return {"status": "ok"}


@router.post("/{project_id}/import")
def import_roster(project_id: int, payload: dict, db: Session = Depends(get_db)):
    # Phase 3 scaffold: roster payload currently provided by caller; OAuth fetch wiring is planned next phase.
    added = import_classroom_roster(db, project_id, payload.get("students", []))
    return {"added": added}
