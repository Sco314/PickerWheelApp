from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Alias, Item, List


def upsert_alias(db: Session, project_id: int, external_id: str, alias_name: str) -> None:
    alias = db.scalar(
        select(Alias).where(Alias.project_id == project_id, Alias.external_id == external_id)
    )
    if alias is None:
        alias = Alias(project_id=project_id, external_id=external_id, alias_name=alias_name)
        db.add(alias)
    else:
        alias.alias_name = alias_name
    db.commit()


def import_classroom_roster(db: Session, project_id: int, roster: list[dict[str, str]]) -> int:
    pickable = db.scalar(select(List).where(List.project_id == project_id, List.kind == "pickable"))
    if pickable is None:
        raise ValueError("Project lists are not initialized")

    added = 0
    for student in roster:
        external_id = student["external_id"]
        display_name = student["display_name"]
        alias = db.scalar(
            select(Alias).where(Alias.project_id == project_id, Alias.external_id == external_id)
        )
        final_name = alias.alias_name if alias else display_name
        existing = db.scalar(
            select(Item).where(Item.list_id == pickable.id, Item.external_id == external_id)
        )
        if existing is None:
            db.add(
                Item(
                    list_id=pickable.id,
                    external_id=external_id,
                    display_name=final_name,
                    sort_order=added,
                )
            )
            added += 1
        else:
            existing.display_name = final_name
    db.commit()
    return added
