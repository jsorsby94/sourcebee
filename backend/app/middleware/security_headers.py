from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.config import get_settings

HSTS_VALUE = "max-age=31536000; includeSubDomains"


def _is_secure_request(request: Request) -> bool:
    forwarded_proto_raw = request.headers.get("x-forwarded-proto", "")
    forwarded_proto = forwarded_proto_raw.split(",", maxsplit=1)[0].strip().lower()
    if forwarded_proto:
        return forwarded_proto == "https"

    return request.url.scheme == "https"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'"
        )
        response.headers["Cache-Control"] = "no-store"
        settings = get_settings()
        if settings.is_production and _is_secure_request(request):
            response.headers["Strict-Transport-Security"] = HSTS_VALUE
        return response
