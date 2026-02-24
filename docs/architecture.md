# Architecture

## Current state (Phase 2)
- Frontend: React + TypeScript + Vite SPA.
- Backend: FastAPI + SQLAlchemy service API.
- DB: SQLite (dev), structured for future Postgres migration.
- Operational flow: add names -> spin -> move selected item -> optional undo/reset/shuffle/clear.
- Persistence includes pick history to support undo/reset semantics.
