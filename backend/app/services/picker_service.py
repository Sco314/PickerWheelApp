import random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Item, List, PickHistory


def _parse_names(raw: str) -> list[str]:
    names = [n.strip() for chunk in raw.splitlines() for n in chunk.split(",")]
    return [n for n in names if n]


def _get_lists(db: Session, project_id: int) -> tuple[List, List]:
    pickable = db.scalar(select(List).where(List.project_id == project_id, List.kind == "pickable"))
    picked = db.scalar(select(List).where(List.project_id == project_id, List.kind == "picked"))
    if pickable is None or picked is None:
        raise ValueError("Project lists are not initialized")
    return pickable, picked


def _reorder(db: Session, list_id: int) -> None:
    items = list(db.scalars(select(Item).where(Item.list_id == list_id).order_by(Item.sort_order, Item.id)))
    for idx, item in enumerate(items):
        item.sort_order = idx


def add_names_to_pickable(db: Session, project_id: int, raw_names: str) -> int:
    pickable, _ = _get_lists(db, project_id)
    names = _parse_names(raw_names)
    existing = db.scalar(select(Item.sort_order).where(Item.list_id == pickable.id).order_by(Item.sort_order.desc()))
    start = existing + 1 if existing is not None else 0
    for idx, name in enumerate(names):
        db.add(Item(list_id=pickable.id, display_name=name, sort_order=start + idx))
    db.commit()
    return len(names)


def spin_once(db: Session, project_id: int) -> str:
    pickable, picked = _get_lists(db, project_id)
    items = list(db.scalars(select(Item).where(Item.list_id == pickable.id).order_by(Item.sort_order)))
    if not items:
        raise ValueError("No pickable items available")

    selected = random.choice(items)
    selected.list_id = picked.id
    _reorder(db, pickable.id)
    _reorder(db, picked.id)

    round_number = db.query(PickHistory).filter(PickHistory.project_id == project_id).count() + 1
    db.add(PickHistory(project_id=project_id, item_id=selected.id, round_number=round_number))
    db.commit()
    db.refresh(selected)
    return selected.display_name


def undo_last_spin(db: Session, project_id: int) -> str:
    pickable, picked = _get_lists(db, project_id)
    last_history = db.scalar(
        select(PickHistory).where(PickHistory.project_id == project_id).order_by(PickHistory.id.desc())
    )
    if last_history is None:
        raise ValueError("No spin history to undo")

    item = db.get(Item, last_history.item_id)
    if item is None:
        raise ValueError("Last picked item no longer exists")

    item.list_id = pickable.id
    db.delete(last_history)
    _reorder(db, picked.id)
    _reorder(db, pickable.id)
    db.commit()
    return item.display_name


def reset_round(db: Session, project_id: int) -> int:
    pickable, picked = _get_lists(db, project_id)
    picked_items = list(db.scalars(select(Item).where(Item.list_id == picked.id).order_by(Item.sort_order)))
    existing_count = db.query(Item).filter(Item.list_id == pickable.id).count()
    for idx, item in enumerate(picked_items):
        item.list_id = pickable.id
        item.sort_order = existing_count + idx

    db.query(PickHistory).filter(PickHistory.project_id == project_id).delete()
    _reorder(db, pickable.id)
    db.commit()
    return len(picked_items)


def shuffle_pickable(db: Session, project_id: int) -> None:
    pickable, _ = _get_lists(db, project_id)
    items = list(db.scalars(select(Item).where(Item.list_id == pickable.id)))
    random.shuffle(items)
    for idx, item in enumerate(items):
        item.sort_order = idx
    db.commit()


def clear_lists(db: Session, project_id: int) -> int:
    pickable, picked = _get_lists(db, project_id)
    deleted = (
        db.query(Item)
        .filter(Item.list_id.in_([pickable.id, picked.id]))
        .delete(synchronize_session=False)
    )
    db.query(PickHistory).filter(PickHistory.project_id == project_id).delete()
    db.commit()
    return deleted


def update_list_title(db: Session, project_id: int, kind: str, title: str) -> str:
    target = db.scalar(select(List).where(List.project_id == project_id, List.kind == kind))
    if target is None:
        raise ValueError("List not found")
    target.title = title.strip() or target.title
    db.commit()
    return target.title
