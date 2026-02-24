from app.db.models import Item, List
from app.db.session import Base, SessionLocal, engine
from app.services.picker_service import (
    add_names_to_pickable,
    clear_lists,
    reset_round,
    shuffle_pickable,
    spin_once,
    undo_last_spin,
)
from app.services.project_service import create_project


def setup_module(module):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _counts(db, project_id: int):
    pickable = db.query(List).filter(List.project_id == project_id, List.kind == 'pickable').first()
    picked = db.query(List).filter(List.project_id == project_id, List.kind == 'picked').first()
    pickable_count = db.query(Item).filter(Item.list_id == pickable.id).count()
    picked_count = db.query(Item).filter(Item.list_id == picked.id).count()
    return pickable_count, picked_count


def test_spin_moves_item_and_undo_restores_it():
    with SessionLocal() as db:
        project = create_project(db, 'Test Project')
        add_names_to_pickable(db, project.id, 'One,Two')
        picked_name = spin_once(db, project.id)
        assert picked_name in {'One', 'Two'}

        pickable_count, picked_count = _counts(db, project.id)
        assert pickable_count == 1
        assert picked_count == 1

        undo_name = undo_last_spin(db, project.id)
        assert undo_name in {'One', 'Two'}

        pickable_count, picked_count = _counts(db, project.id)
        assert pickable_count == 2
        assert picked_count == 0


def test_reset_shuffle_and_clear():
    with SessionLocal() as db:
        project = create_project(db, 'Another Project')
        add_names_to_pickable(db, project.id, 'A,B,C')
        shuffle_pickable(db, project.id)
        spin_once(db, project.id)

        moved = reset_round(db, project.id)
        assert moved == 1

        deleted = clear_lists(db, project.id)
        assert deleted == 3
