from app.db.session import Base, SessionLocal, engine
from app.services.picker_service import add_names_to_pickable, spin_once
from app.services.project_service import create_project


def setup_module(module):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_spin_moves_item():
    with SessionLocal() as db:
        project = create_project(db, "Test Project")
        add_names_to_pickable(db, project.id, "One,Two")
        picked = spin_once(db, project.id)
        assert picked in {"One", "Two"}
