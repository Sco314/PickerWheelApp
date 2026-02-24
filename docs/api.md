# API

## Core
- `GET /health`
- `GET /projects`
- `POST /projects` `{ "title": "..." }`

## Picker
- `POST /picker/{project_id}/names` `{ "names": "a,b\nc" }`
- `POST /picker/{project_id}/spin`
- `POST /picker/{project_id}/undo`
- `POST /picker/{project_id}/reset`
- `POST /picker/{project_id}/shuffle`
- `POST /picker/{project_id}/clear`
- `PATCH /picker/{project_id}/titles/{kind}` `{ "title": "..." }` where `{kind}` is `pickable` or `picked`
- `GET /picker/{project_id}/state`
