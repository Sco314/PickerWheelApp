# Architecture

## Current state (Phase 3)
- Frontend: React + TypeScript + Vite SPA.
- Backend: FastAPI + SQLAlchemy service API.
- DB: SQLite (dev), structured for future Postgres migration.
- Operational flow: add names -> spin -> move selected item -> optional undo/reset/shuffle/clear.
- Session persistence: backend user settings persist the last used project.
- Classroom sync scaffolding: alias persistence and import endpoints exist; OAuth retrieval integration is staged next.
