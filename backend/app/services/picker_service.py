import random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Item, List


def _parse_names(raw: str) -> list[str]:
    names = [n.strip() for chunk in raw.splitlines() for n in chunk.split(",")]
    return [n for n in names if n]


def add_names_to_pickable(db: Session, project_id: int, raw_names: str) -> int:
    pickable = db.scalar(select(List).where(List.project_id == project_id, List.kind == "pickable"))
    assert pickable is not None
    names = _parse_names(raw_names)
    for idx, name in enumerate(names):
        db.add(Item(list_id=pickable.id, display_name=name, sort_order=idx))
    db.commit()
    return len(names)


def spin_once(db: Session, project_id: int) -> str:
    pickable = db.scalar(select(List).where(List.project_id == project_id, List.kind == "pickable"))
    picked = db.scalar(select(List).where(List.project_id == project_id, List.kind == "picked"))
    assert pickable is not None and picked is not None

    items = list(db.scalars(select(Item).where(Item.list_id == pickable.id).order_by(Item.sort_order)))
    if not items:
        raise ValueError("No pickable items available")

    selected = random.choice(items)
    selected.list_id = picked.id
    db.commit()
    db.refresh(selected)
    return selected.display_name
