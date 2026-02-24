from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Item, List
from app.db.session import get_db
from app.schemas.picker import NamesInput, SpinResult
from app.services.picker_service import add_names_to_pickable, spin_once

router = APIRouter(prefix="/picker", tags=["picker"])


@router.post("/{project_id}/names")
def add_names(project_id: int, payload: NamesInput, db: Session = Depends(get_db)):
    count = add_names_to_pickable(db, project_id, payload.names)
    return {"added": count}


@router.post("/{project_id}/spin", response_model=SpinResult)
def spin(project_id: int, db: Session = Depends(get_db)):
    try:
        picked = spin_once(db, project_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return SpinResult(picked=picked)


@router.get("/{project_id}/state")
def get_state(project_id: int, db: Session = Depends(get_db)):
    lists = list(db.scalars(select(List).where(List.project_id == project_id)))
    payload = {}
    for list_obj in lists:
        items = list(db.scalars(select(Item).where(Item.list_id == list_obj.id).order_by(Item.sort_order)))
        payload[list_obj.kind] = {
            "title": list_obj.title,
            "items": [item.display_name for item in items],
        }
    return payload
