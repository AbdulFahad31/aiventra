# ForensiAI — Agents Guide

## Repository Layout

- `backend/` — Python/FastAPI backend (Python 3.10+, runs on port 8000)
- `frontend/` — Vite + React + TypeScript frontend (runs on port 3000)

The frontend has two rendering systems coexisting: `src/` (Vite, React, SSR disabled) and `app/` (Next.js pages). The `src/App.tsx` is the primary SPA entrypoint.

## Running the Project

```bash
# Backend
cd backend
cp .env.example .env         # add FEATHERLESS_API_KEY
pip install -r requirements.txt
python main.py               # starts on http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # starts on http://localhost:3000
```

Both must be running simultaneously. The frontend reads `NEXT_PUBLIC_API_URL` from `frontend/.env.local` (defaults to `http://localhost:8000`).

## Key Commands

- Backend entry: `python main.py` inside `backend/` — NOT in the repo root
- Frontend dev: `npm run dev` inside `frontend/`
- Frontend build: `npm run build` (runs `tsc -b && vite build`)

## Backend Architecture

- Entry: `backend/main.py` — FastAPI app with lifespan (initializes DB, creates uploads dir)
- Database: SQLite auto-created as `backend/forensiai.db`
- Models: `backend/models.py` (6 tables: cases, evidence, timeline_events, ai_results, risk_flags, + base)
- Routes: `backend/routes/` (cases, upload, analysis, results, timeline, reports)
- Services: `backend/services/` (parsers, engines — mostly deterministic)
- Agents: `backend/agents/` (CrewAI agents: autopsy, correlation, summary)
- AI: Uses Featherless AI via LiteLLM. Falls back to mock/deterministic responses if unavailable.
- No test suite exists; manual API testing via `curl` or `http://localhost:8000/docs`

## Frontend Architecture

- Vite SPA at `src/App.tsx` is the main UI (dashboard, case flow, graphs, charts)
- Next.js `app/` pages coexist (login, cases, etc.) but the SPA handles core UX
- `frontend/src/lib/api.ts` — API client; reads env vars with fallbacks: `VITE_API_URL` > `NEXT_PUBLIC_API_URL` > `http://localhost:8000`
- `frontend/src/lib/types.ts` — Shared TypeScript interfaces for API types
- Styles: Tailwind CSS (`tailwind.config.ts`) + global `index.css`
- Charts: Recharts; Graph: ReactFlow + dagre; Animations: Framer Motion; Icons: Lucide
- The `.eslintrc.json` extends `next/core-web-vitals` despite being a Vite app (linting config mismatch, ignore for edits)

## Critical Gotchas

- **Missing `.env`**: Backend will not run AI agents without `FEATHERLESS_API_KEY` in `backend/.env`
- **Port conflicts**: Backend uses 8000, frontend uses 3000. Check before restarting.
- **Vite proxy not configured**: Frontend hits the API directly via `NEXT_PUBLIC_API_URL` in `.env.local`, not via Vite dev server proxy. Both services must be running for API calls to succeed.
- **Hybrid rendering**: `src/` is Vite/React (ESM), `app/` is Next.js (CJS-style). Don't mix patterns.
- **No tests**: There is no test suite. Verify changes by running both servers and testing via Swagger (`/docs`) or the frontend UI.

## Config Files to Respect

- `backend/requirements.txt` — pinned deps, install via `pip install -r requirements.txt`
- `frontend/package.json` — `dev` uses `vite --host 127.0.0.1 --port 3000`
- `frontend/vite.config.js` — path alias `@` → `./src`
- `frontend/tsconfig.json` — strict mode, baseUrl `.`, paths `@/*` → `./src/*`
- `backend/.env.example` — source of truth for required env vars
