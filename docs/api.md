# API

## Core
- `GET /health`

## Projects
- `GET /projects`
- `POST /projects` `{ "title": "..." }`
- `PATCH /projects/{project_id}` `{ "title": "..." }`
- `DELETE /projects/{project_id}`
- `GET /projects/settings`
- `PATCH /projects/settings` `{ "last_project_id": 123 | null }`

## Picker
- `POST /picker/{project_id}/names` `{ "names": "a,b\nc" }`
- `POST /picker/{project_id}/spin`
- `POST /picker/{project_id}/undo`
- `POST /picker/{project_id}/reset`
- `POST /picker/{project_id}/shuffle`
- `POST /picker/{project_id}/clear`
- `PATCH /picker/{project_id}/titles/{kind}` `{ "title": "..." }` where `{kind}` is `pickable` or `picked`
- `GET /picker/{project_id}/state`

## Classroom + Auth (Phase 3 scaffold)
- `GET /auth/google/start`
- `GET /auth/google/callback`
- `POST /classroom/{project_id}/aliases` `{ "external_id": "...", "alias_name": "..." }`
- `POST /classroom/{project_id}/import` `{ "students": [{"external_id": "...", "display_name": "..."}] }`
