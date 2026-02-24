# PickerWheelApp

A clean classroom random picker app with project-based persistence.

## What it does
- Keeps a Pickable list and Picked list per project.
- Spins to choose one random student/item and moves them to Picked.
- Saves and reloads project/session state.

## Features
### Phase 1 (completed)
- React + TypeScript frontend scaffold.
- FastAPI backend with SQLite.
- Project creation and selection.
- Name paste/import (comma or newline separated).
- Spin + state persistence.

### Phase 2 (completed)
- Undo last spin.
- Reset round (move picked back to pickable).
- Shuffle pickable list.
- Clear both lists.
- Editable list titles with inline edit UI.
- Basic visual spin animation.

### Phase 3 (current)
- Backend-managed session preference (`last_project_id`) via `user_settings`.
- Project lifecycle APIs for rename/delete.
- Data model expansion for `aliases` and `user_settings` tables.
- Classroom import scaffolding endpoints and Google auth placeholder endpoints.

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

## API (quick view)
- `GET /health`
- `GET /projects`
- `POST /projects`
- `PATCH /projects/{project_id}`
- `DELETE /projects/{project_id}`
- `GET /projects/settings`
- `PATCH /projects/settings`
- `POST /picker/{project_id}/names`
- `POST /picker/{project_id}/spin`
- `POST /picker/{project_id}/undo`
- `POST /picker/{project_id}/reset`
- `POST /picker/{project_id}/shuffle`
- `POST /picker/{project_id}/clear`
- `PATCH /picker/{project_id}/titles/{kind}`
- `GET /picker/{project_id}/state`
- `GET /auth/google/start`
- `GET /auth/google/callback`
- `POST /classroom/{project_id}/aliases`
- `POST /classroom/{project_id}/import`

## Google Classroom roster collection
Current implementation in Phase 3 provides the backend scaffolding for roster sync:
- Alias records are persisted by `project_id + external_id` to preserve nickname overrides.
- Import endpoint accepts student records (`external_id`, `display_name`) and applies alias overrides when present.
- OAuth endpoints are placeholders and intentionally return scaffold status for now.

Planned next step for full Google Classroom collection:
1. Implement OAuth start/callback to exchange authorization code and store tokens securely.
2. Call Google Classroom APIs to fetch courses and roster for selected course.
3. Map each student to canonical `external_id` and `display_name`.
4. Upsert aliases first, then import roster so aliases remain stable after every sync.
5. Add sync timestamp/status fields and user-facing sync controls.

## Security/privacy notes
For educational usage, operators are responsible for lawful data handling and policy compliance.

## License/terms notice
This project is proprietary and all rights are reserved.
See `LICENSE`, `TERMS.md`, and `NOTICE`.

## Documentation maintenance requirement
Documentation must be updated in the same change set as any behavior, API, setup, schema, phase, or workflow change. README and docs are required to remain current and consistent with implementation at all times.

## Phase summary changelog
- **Phase 1:** Established MVP scaffold with frontend/backend structure, base data model (`projects`, `lists`, `items`), project selection, add names, spin flow, persistence, and initial tests.
- **Phase 2:** Added operational classroom workflow controls (undo, reset round, shuffle, clear), editable list titles, pick history support for undo/reset behavior, and UI interaction polish.
- **Phase 3:** Added project/session lifecycle hardening (`user_settings`, last-project persistence in backend, project rename/delete APIs), plus Google Classroom import/auth scaffolding with alias-preserving import design.
