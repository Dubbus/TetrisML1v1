# Frontend Handoff

Quick checklist and commands for backend testers and integrators.

Run locally (dev + mock):

```powershell
cd frontend2
npm install
npm run mock    # starts json-server -> http://localhost:4000
npm run dev     # starts Vite dev -> http://localhost:5173
```

Run the smoke test (validates GET and POST against the API base):

```powershell
# uses VITE_API_BASE_URL if set, otherwise http://localhost:4000
npm run smoke
```

Environment variables
- `VITE_API_BASE_URL` — base URL for leaderboard API (e.g. `https://api.example.com`).
  - For local dev set to `http://localhost:4000` or leave unset to target the mock.

API expectations (short):
- GET /scores?_sort=score&_order=desc&_limit=10 -> returns 200 + JSON array of scores
- POST /scores with { name, score, timestamp } -> returns 201/200 with created item

Notes for backend team
- CORS must allow the frontend origin(s): `http://localhost:5173` and deployed domain(s).
- If auth is required, tell me the header name and token flow and I will wire it into `cloudApi.ts`.
