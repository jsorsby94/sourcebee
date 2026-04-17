# Analytics Service

## Purpose

Collect behavior telemetry at high volume while preserving zero-retention for sensitive tool content.

## Consent model

- First visit: show analytics consent banner
- `Accept`: enable analytics, set visitor ID cookie, and allow analytics events
- `Reject`: keep analytics disabled and continue normal app usage
- Until `Accept`: do not set `visitor_id` cookie and do not send analytics events to `/internal/events`

## Cookie categories

- Essential (minimal): analytics consent preference cookie
- Analytics: visitor ID cookie (`sourcebee_vid`)

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

## Privacy note on IP addresses

- Raw IP addresses are personal data under GDPR and similar laws.
- Privacy disclosure is required even when analytics cookies are rejected.
- Consent requirements can vary by jurisdiction.

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
