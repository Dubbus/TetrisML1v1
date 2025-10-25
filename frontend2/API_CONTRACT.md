# API Contract — Tetris Frontend

This document describes the minimal API the frontend expects from the backend leaderboard service.

Base URL
- The frontend expects the base API URL in the environment variable `VITE_API_BASE_URL`.
- For local development against the mock server use: `http://localhost:4000`.

Endpoints

1) GET /scores
- Purpose: retrieve leaderboard entries.
- Query parameters used by frontend: `_sort=score&_order=desc&_limit={n}`
- Example request: `GET /scores?_sort=score&_order=desc&_limit=10`
- Response: 200 OK
  - JSON array of score objects: [{ id, name, score, timestamp }, ...]

2) POST /scores
- Purpose: submit a new score.
- Request body (application/json):
  {
    "name": "PlayerName",
    "score": 1234,
    "timestamp": "2025-10-25T12:34:56.000Z"
  }
- Response: 201 Created (recommended) with the created object (including `id`), or 200 OK with created object.

3) Optional: GET /health
- Purpose: lightweight health/readiness check
- Response: 200 OK with a small JSON like { "status": "ok" }.

CORS requirements
- Allow origins used for frontends: local dev `http://localhost:5173` and any deployed domains.
- Allowed methods: GET, POST, OPTIONS
- Allowed headers: Content-Type, Authorization (if used)

Notes
- The frontend currently performs unauthenticated POSTs to `/scores`. If you require authentication, provide a short token-based header flow and I will update the frontend to include the token in requests.
