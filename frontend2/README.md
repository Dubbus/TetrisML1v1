# frontend2 — Clean React + TypeScript frontend for TetrisML

This folder is a clean, opinionated frontend scaffold for the TetrisML project. It is intended to be a drop-in easier-to-use frontend for teammates to test the backend AI and leaderboard endpoints.

What this contains
- Vite + React + TypeScript app in `frontend2/`
- Game code in `src/gamedev/` (edit `GameBoard.tsx` for gameplay)
- `src/cloudApi.ts` — small adapter using `VITE_API_BASE_URL`
- `mock/db.json` — a json-server mock with initial scores for local testing

Quick start

1) From the repo root (or use your preferred terminal):

```powershell
cd frontend2
npm install
```

2) Start the mock backend (optional, useful for local testing):

```powershell
npm run mock
# json-server will run at http://localhost:4000
```

3) Start the frontend dev server in a second terminal:

```powershell
npm run dev
```

4) Copy env example if you need to override API URL:

```powershell
copy .env.local.example .env.local
# edit .env.local to set VITE_API_BASE_URL (defaults to http://localhost:4000)
```

Notes and recommendations
- The mock server exposes:
- The mock server exposes (json-server):
  - GET /scores -> all scores (the app requests `/scores?_sort=score&_order=desc&_limit=10` for top scores)
  - POST /scores -> add a new score (the app POSTs to `/scores`)

- Your backend teammates can point the frontend to the real backend by setting `VITE_API_BASE_URL` in `.env.local`.
- Keep all game logic in `src/gamedev/` and UI in `src/components/` (if you add components).

What I added in `frontend2`:
- A Leaderboard UI component at `src/components/Leaderboard.tsx` that shows the top 10 scores.
- Game-over save flow in `src/gamedev/GameBoard.tsx`: when the game ends you can enter a name and save your score (this calls `saveScore()` which POSTs to `/scores`).

If you want more, I can:
- Add automatic refresh of the leaderboard after saving a score.
- Add a small CI deploy config (Amplify) or an S3/CloudFront deploy script.

