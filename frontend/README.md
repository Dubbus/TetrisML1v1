Frontend folder for TetrisML1v1

Structure:

- clouddev/: Vite + React app (TypeScript). Run from this directory or via root scripts.
- gamedev/: game logic (React/JSX + helper scripts). Currently minimal.

Run locally (from repo root):

  npm run install:all
  npm run dev

Or from the clouddev folder:

  cd frontend/clouddev
  npm install
  npm run dev

Notes:
- `saveScore.js` and `getScores.js` in `clouddev/` are placeholders.
- Amplify configuration is present in `clouddev/amplify/`.
