from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Item, List
from app.db.session import get_db
from app.schemas.picker import ListTitleUpdate, NamesInput, SpinResult
from app.services.picker_service import (
    add_names_to_pickable,
    clear_lists,
    reset_round,
    shuffle_pickable,
    spin_once,
    undo_last_spin,
    update_list_title,
)

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


@router.post("/{project_id}/undo", response_model=SpinResult)
def undo(project_id: int, db: Session = Depends(get_db)):
    try:
        picked = undo_last_spin(db, project_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return SpinResult(picked=picked)


@router.post("/{project_id}/reset")
def reset(project_id: int, db: Session = Depends(get_db)):
    moved = reset_round(db, project_id)
    return {"moved": moved}


@router.post("/{project_id}/shuffle")
def shuffle(project_id: int, db: Session = Depends(get_db)):
    shuffle_pickable(db, project_id)
    return {"status": "ok"}


@router.post("/{project_id}/clear")
def clear(project_id: int, db: Session = Depends(get_db)):
    deleted = clear_lists(db, project_id)
    return {"deleted": deleted}


@router.patch("/{project_id}/titles/{kind}")
def patch_title(project_id: int, kind: str, payload: ListTitleUpdate, db: Session = Depends(get_db)):
    if kind not in {"pickable", "picked"}:
        raise HTTPException(status_code=400, detail="Invalid list kind")
    try:
        title = update_list_title(db, project_id, kind, payload.title)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"title": title}


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
