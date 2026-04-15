# Security Design Summary

## Threat model

Primary threats include SSRF on SSL checker, endpoint abuse, malformed input attacks, dependency vulnerabilities, information leakage through errors/logs, and analytics data exposure.

## Core controls

- Strict input validation in FastAPI for every endpoint.
- Deterministic tools still validated on server for public API consistency.
- Rate limiting using Redis keys per endpoint+IP+minute.
- Request body size limit middleware.
- Timeout protections on SSL checks.
- No shell execution for network behavior.
- Structured errors with request ID, no stack traces in client responses.
- Security headers on backend and frontend.
- CORS allowlist kept minimal.
- Cache-Control set to no-store for API responses.

## SSL checker SSRF mitigation

- Accept hostname only, no URL scheme/path/query/port/userinfo.
- Normalize with IDNA.
- DNS resolve and reject any non-public targets.
- Allow outbound connection only to resolved public IPs on TCP/443.
- Use TLS handshake via Python ssl APIs only.

## Secrets and dependencies

- No secrets committed.
- Runtime config from env files/secrets manager.
- Keep dependencies minimal and patch frequently.

## Zero-retention privacy model

- Uploaded/generated files (images, PDFs, QR outputs) are processed transiently and never persisted.
- Password generator output is returned in-memory only and is never stored in logs, Redis, or database layers.
- Redis is used only for rate-limit metadata and selected non-sensitive cache entries.
- Temporary processing artifacts must be in ephemeral runtime storage and immediately removed after processing.

## Behavior analytics model

- Behavior metadata is intentionally collected and persisted in MongoDB for analysis.
- Stored fields include IP, pathname, tool slug, request status/latency, user-agent, referrer, language, request ID, and visitor ID.
- Sensitive tool content is not stored: no request/response bodies, no uploaded files, no generated password values, no QR text payloads.
- Analytics ingestion sanitizes and drops suspicious metadata keys such as `input`, `token`, `password`, `data`, `file`, `content`, and `payload`.
- Query strings are removed from stored route/referrer paths to reduce accidental sensitive leakage.
- Analytics dashboard is no-auth by design and must remain internal-only.
