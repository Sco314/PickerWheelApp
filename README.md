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

## Credits

### Sound Effects
Sounds are synthesized via Web Audio API. The following CC0 (Public Domain) sounds from [Freesound.org](https://freesound.org) were researched as references and recommended alternatives:

- **Tick/Flapper**: ["spin-tick.mp3"](https://freesound.org/people/door15studio/sounds/244774/) by door15studio (CC0) — purpose-built spinner wheel tick
- **Tick alt**: ["Click Tick.wav"](https://freesound.org/people/malle99/sounds/384187/) by malle99 (CC0)
- **Tick alt**: [Mouse clicks](https://freesound.org/people/Breviceps/sounds/447938/) by Breviceps (CC0)
- **Celebration**: ["TaDa!.wav"](https://freesound.org/people/jimhancock/sounds/376318/) by jimhancock (CC0) — trumpet fanfare sting
- **Celebration alt**: ["Victory Bells"](https://freesound.org/people/Licorne_En_Fer/sounds/647709/) by Licorne_En_Fer (CC0)
- **Celebration alt**: ["success.wav"](https://freesound.org/people/grunz/sounds/109662/) by grunz (CC0)
- **Applause alt**: ["Small applause"](https://freesound.org/people/Breviceps/sounds/462362/) by Breviceps (CC0)

### Design Inspiration
- [Wheel of Names](https://wheelofnames.com) by [momander](https://github.com/momander/wheel-spinner) (Apache-2.0)

Full credits are also available in-app under Settings > Credits.

## License/terms notice
This project is proprietary and all rights are reserved.
See `LICENSE`, `TERMS.md`, and `NOTICE`.
