# Simple Tools Hub

Public website of fast, useful, SEO-optimized developer tools.

## Stack

- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Backend: FastAPI + Pydantic
- Shared state: Redis
- Container orchestration: Docker Compose

## Tools

- JWT decoder
- Base64 encode/decode
- JSON formatter / validator
- Unit converter
- Calculator
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

## Environments

- `dev` environment:
  - Frontend: `http://localhost:3004`
  - Services: `frontend-dev`, `backend-dev`, `redis-dev`
- `prod` environment:
  - Frontend: `http://localhost:3005`
  - Services: `frontend-prod`, `backend-prod`, `redis-prod`

Both environments can run simultaneously without port/name collisions.

## Quick start

1. Start dev only:
   - `docker compose --profile dev up --build -d`
2. Start prod only:
   - `docker compose --profile prod up --build -d`
3. Start both together:
   - `docker compose --profile dev --profile prod up --build -d`
4. Open:
   - Dev frontend: `http://localhost:3004`
   - Prod frontend: `http://localhost:3005`
   - Backends are internal-only (not host-published).
5. Optional backend health checks:
   - Dev: `docker compose exec backend-dev python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/health', timeout=3).read().decode())"`
   - Prod: `docker compose exec backend-prod python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/health', timeout=3).read().decode())"`
6. Stop:
   - Dev only: `docker compose stop frontend-dev backend-dev redis-dev`
   - Prod only: `docker compose stop frontend-prod backend-prod redis-prod`
   - Both + cleanup: `docker compose --profile dev --profile prod down`

Optional: copy env templates if you want local overrides.

- `cp frontend/.env.example frontend/.env`
- `cp backend/.env.example backend/.env`

## Monorepo layout

- `frontend/`: Next.js app, SEO pages, proxy routes, UI
- `backend/`: FastAPI services and API routes
- `docs/`: security, SEO, and deployment hardening guidance
- `infra/`: optional production reverse proxy examples

## Security notes

The app is internet-facing. For deployment hardening recommendations see:

- `docs/SECURITY.md`
- `docs/DEPLOYMENT.md`
