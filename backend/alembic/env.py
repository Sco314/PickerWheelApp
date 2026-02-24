from app.db.models import Base
from app.db.session import engine

target_metadata = Base.metadata


def run_migrations_online():
    with engine.begin() as connection:
        context = __import__("alembic.context").context
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()
