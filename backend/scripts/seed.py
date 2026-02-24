from app.db.session import SessionLocal
from app.services.project_service import create_project
from app.services.picker_service import add_names_to_pickable


def run_seed() -> None:
    with SessionLocal() as db:
        project = create_project(db, "Demo Project")
        add_names_to_pickable(db, project.id, "Alice,Bob,Charlie\nDana")
        print(f"Seeded project {project.id}: {project.title}")


if __name__ == "__main__":
    run_seed()
