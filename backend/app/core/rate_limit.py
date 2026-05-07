import logging
import time
import ipaddress
from typing import Literal

from fastapi import Request
from redis.exceptions import RedisError

from app.core.analytics import emit_backend_event
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.redis import get_redis_from_request

logger = logging.getLogger(__name__)

RateLimitProfile = Literal["default", "ssl", "file", "pdf"]


def _valid_ip(value: str | None) -> str | None:
    if not value:
        return None

    candidate = value.strip()
    if not candidate:
        return None

    try:
        ipaddress.ip_address(candidate)
    except ValueError:
        return None

    return candidate


def _extract_forwarded_ip(forwarded_header: str | None) -> str | None:
    if not forwarded_header:
        return None

    # Work from right to left to reduce spoofing risk when upstream proxies append
    # the true connecting address to any user-supplied chain.
    for token in reversed(forwarded_header.split(",")):
        parsed = _valid_ip(token)
        if parsed is not None:
            return parsed

    return None


def get_client_ip(request: Request) -> str:
    forwarded = _extract_forwarded_ip(request.headers.get("x-forwarded-for"))
    if forwarded:
        return forwarded

    real_ip = _valid_ip(
        request.headers.get("x-real-ip") or request.headers.get("cf-connecting-ip")
    )
    if real_ip:
        return real_ip

    if request.client and request.client.host:
        client_ip = _valid_ip(request.client.host)
        if client_ip:
            return client_ip
    return "unknown"


async def enforce_rate_limit(request: Request, endpoint: str, limit: int) -> None:
    settings = get_settings()
    redis_client = get_redis_from_request(request)

    if redis_client is None:
        if settings.is_production:
            await emit_backend_event(
                request,
                event_type="rate_limit_unavailable",
                status_code=503,
                meta={"endpoint": endpoint},
            )
            raise AppError(
                503, "rate_limit_unavailable", "Rate limiting is currently unavailable"
            )
        return

    ip = get_client_ip(request)
    minute_bucket = int(time.time() // 60)
    key = f"rl:{endpoint}:{ip}:{minute_bucket}"

    try:
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, 120)
    except RedisError as exc:
        logger.warning("rate_limit_redis_error", extra={"path": request.url.path})
        if settings.is_production:
            await emit_backend_event(
                request,
                event_type="rate_limit_redis_error",
                status_code=503,
                meta={"endpoint": endpoint},
            )
            raise AppError(
                503, "rate_limit_unavailable", "Rate limiting is currently unavailable"
            ) from exc
        return

    if count > limit:
        await emit_backend_event(
            request,
            event_type="rate_limited",
            status_code=429,
            meta={"endpoint": endpoint, "limit": limit, "count": count},
        )
        raise AppError(
            429, "rate_limited", "Too many requests. Please try again shortly"
        )


def _resolve_limit(profile: RateLimitProfile) -> int:
    settings = get_settings()
    if profile == "ssl":
        return settings.rate_limit_ssl_per_minute
    if profile == "file":
        return settings.rate_limit_file_per_minute
    if profile == "pdf":
        return settings.rate_limit_pdf_per_minute
    return settings.rate_limit_default_per_minute


def rate_limit_dependency(endpoint: str, profile: RateLimitProfile = "default"):
    async def dependency(request: Request) -> None:
        limit = _resolve_limit(profile)
        await enforce_rate_limit(request, endpoint=endpoint, limit=limit)

    return dependency
