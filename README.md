# PickerWheelApp

A clean classroom random picker app with project-based persistence.

## What it does
- Keeps a Pickable list and Picked list per project.
- Spins to choose one random student/item and moves them to Picked.
- Saves and reloads project state.

## Features (Phase 1)
- React + TypeScript frontend.
- FastAPI backend with SQLite.
- Project creation and selection.
- Name paste/import (comma or newline separated).
- Spin + state persistence.

## Local setup
1. Copy `.env.example` to `.env` and adjust if needed.
2. Backend:
   - `cd backend`
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install -e .[dev]`
3. Frontend:
   - `cd frontend`
   - `npm install`

## Run frontend/backend
- Backend: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm run dev`

## DB migration + seed
- Migration baseline included under `backend/alembic/versions/0001_initial.py`.
- Seed demo data: `cd backend && python scripts/seed.py`

## Env vars
See `.env.example`.

## Google Classroom setup
Planned for a later phase, variables are predeclared in `.env.example`.

## Security/privacy notes
For educational usage, operators are responsible for lawful data handling and policy compliance.

## License/terms notice
This project is proprietary and all rights are reserved.
See `LICENSE`, `TERMS.md`, and `NOTICE`.
