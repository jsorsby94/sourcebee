# Sourcebee

Public website of fast, useful, SEO-optimized developer tools.

## Stack

- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Backend: FastAPI + Pydantic
- Analytics: FastAPI + MongoDB dashboard service
- Shared state: Redis
- Container orchestration: Docker Compose

## Tools

- JWT decoder
- Base64 encode/decode
- URL encoder/decoder
- JSON formatter / validator
- JSON <-> YAML converter
- Hash generator
- UUID generator
- Timestamp converter
- Cron parser/generator
- Unit converter
- SSL certificate checker
- QR code generator
- Image converter
- PDF utilities (merge, split, compress)
- Secure password generator
- Hex/RGB color converter

## Privacy promise

- Sensitive inputs and generated outputs are never persisted.
- Uploaded files are processed transiently and discarded immediately after response.
- Passwords and passphrases are generated on demand and never logged or stored.
- Behavior analytics metadata is collected and stored (IP, routes, tool usage, status, latency, user-agent, referrer).

## Environments

- `dev` environment:
  - Frontend: `http://localhost:4000`
  - Analytics dashboard: `http://localhost:4100/dashboard`
  - Services: `frontend-dev`, `backend-dev`, `redis-dev`, `analytics-dev`, `mongodb-dev`
- `prod` environment:
  - Frontend (public domain): `https://sourcebee.org`
  - Frontend (local compose port): `http://localhost:4001`
  - Analytics dashboard: `http://localhost:4101/dashboard`
  - Services: `frontend-prod`, `backend-prod`, `redis-prod`, `analytics-prod`, `mongodb-prod`

Both environments can run simultaneously without port/name collisions.

## Quick start

1. Start dev only:
   - `docker compose --profile dev up --build -d`
2. Start prod only:
   - `docker compose --profile prod up --build -d`
3. Start both together:
   - `docker compose --profile dev --profile prod up --build -d`
4. Open:
   - Dev frontend: `http://localhost:4000`
   - Prod frontend (local compose): `http://localhost:4001`
   - Prod frontend (deployed): `https://sourcebee.org`
   - Dev analytics dashboard (internal localhost bind): `http://localhost:4100/dashboard`
   - Prod analytics dashboard (internal localhost bind): `http://localhost:4101/dashboard`
   - Backends are internal-only (not host-published).
5. Optional backend health checks:
   - Dev: `docker compose exec backend-dev python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/health', timeout=3).read().decode())"`
   - Prod: `docker compose exec backend-prod python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/health', timeout=3).read().decode())"`
6. Stop:
   - Dev only: `docker compose stop frontend-dev backend-dev redis-dev analytics-dev mongodb-dev`
   - Prod only: `docker compose stop frontend-prod backend-prod redis-prod analytics-prod mongodb-prod`
   - Both + cleanup: `docker compose --profile dev --profile prod down`

Optional: copy env templates if you want local overrides.

- `cp frontend/.env.example frontend/.env`
- `cp backend/.env.example backend/.env`

## Monorepo layout

- `frontend/`: Next.js app, SEO pages, proxy routes, UI
- `backend/`: FastAPI services and API routes
- `analytics/`: internal analytics ingest API + Mongo-backed dashboard
- `docs/`: security, SEO, and deployment hardening guidance
- `infra/`: optional production reverse proxy examples

## Security notes

The app is internet-facing. For deployment hardening recommendations see:

- `docs/SECURITY.md`
- `docs/DEPLOYMENT.md`
- `docs/ANALYTICS.md`
