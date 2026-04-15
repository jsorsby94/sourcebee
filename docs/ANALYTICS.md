# Analytics Service

## Purpose

Collect behavior telemetry at high volume while preserving zero-retention for sensitive tool content.

## Stored telemetry metadata

- client IP (raw)
- pathname
- tool slug
- event type and source
- HTTP status code
- latency
- user-agent
- referrer (query stripped)
- language
- request ID
- visitor ID cookie
- non-sensitive metadata fields

## Never stored

- tool request bodies
- uploaded image/PDF content
- generated passwords/passphrases
- QR payload text
- binary response content

## Internal endpoints

- `POST /internal/events`
- `GET /api/analytics/summary`
- `GET /api/analytics/timeseries`
- `GET /api/analytics/events`
- `GET /dashboard`

## Local dashboard URLs

- Dev: `http://localhost:4100/dashboard`
- Prod: `http://localhost:4101/dashboard`

Dashboard is intentionally no-auth for MVP and must stay internal-only.
