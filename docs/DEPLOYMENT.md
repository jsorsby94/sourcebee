# Deployment Hardening Recommendations

## Reverse proxy

Use Caddy or Nginx in front of the app for:

- TLS termination
- HTTP to HTTPS redirect
- HSTS and additional edge headers
- Request size limits at edge
- Basic DDoS/WAF style protections where available

## Network

- Keep backend private to internal network.
- Expose only reverse proxy/public frontend service.
- Restrict egress from backend if platform supports it.

## Runtime hardening

- Run containers as non-root.
- Use read-only root filesystem where feasible.
- Use `no-new-privileges`.
- Set CPU/memory limits.

## Observability

- Centralized structured logs with request IDs.
- Track rate-limit events and blocked SSL targets.
- Alert on spikes in 4xx/5xx and endpoint abuse patterns.
