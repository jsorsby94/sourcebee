from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlsplit

import httpx
from fastapi import Request

from app.core.config import get_settings

logger = logging.getLogger(__name__)

SENSITIVE_KEY_FRAGMENTS = (
    "input",
    "token",
    "password",
    "data",
    "file",
    "content",
    "payload",
)


def _is_sensitive_key(key: str) -> bool:
    lowered = key.lower()
    return any(fragment in lowered for fragment in SENSITIVE_KEY_FRAGMENTS)


def _sanitize_meta(value: Any, depth: int = 0) -> Any:
    if depth > 4:
        return None

    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            if not isinstance(key, str):
                continue
            if _is_sensitive_key(key):
                continue
            clean_item = _sanitize_meta(item, depth + 1)
            if clean_item is not None:
                sanitized[key] = clean_item
        return sanitized

    if isinstance(value, list):
        items: list[Any] = []
        for item in value[:50]:
            clean_item = _sanitize_meta(item, depth + 1)
            if clean_item is not None:
                items.append(clean_item)
        return items

    if isinstance(value, (str, int, float, bool)):
        if isinstance(value, str):
            return value[:1024]
        return value

    return None


def _normalize_pathname(pathname: str | None) -> str:
    raw = (pathname or "").strip()
    if not raw:
        return "/"

    if raw.startswith("http://") or raw.startswith("https://"):
        parsed = urlsplit(raw)
        return parsed.path or "/"

    path_only = raw.split("?", maxsplit=1)[0].split("#", maxsplit=1)[0].strip()
    if not path_only:
        return "/"
    if not path_only.startswith("/"):
        return f"/{path_only}"
    return path_only


def _normalize_referrer(referrer: str | None) -> str | None:
    if not referrer:
        return None

    raw = referrer.strip()
    if not raw:
        return None

    try:
        parsed = urlsplit(raw)
    except Exception:  # noqa: BLE001
        return None

    if not parsed.scheme or not parsed.netloc:
        return None

    return f"{parsed.scheme}://{parsed.netloc}{parsed.path or '/'}"


def _extract_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",", maxsplit=1)[0].strip()

    real_ip = request.headers.get("x-real-ip") or request.headers.get(
        "cf-connecting-ip"
    )
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "unknown"


async def emit_backend_event(
    request: Request,
    event_type: str,
    status_code: int | None = None,
    tool_slug: str | None = None,
    meta: dict[str, Any] | None = None,
) -> None:
    settings = get_settings()
    if not settings.analytics_enabled:
        return

    base_url = settings.analytics_internal_url.strip()
    if not base_url:
        return

    clean_meta_raw = _sanitize_meta(meta or {})
    clean_meta = clean_meta_raw if isinstance(clean_meta_raw, dict) else {}

    request_id = getattr(request.state, "request_id", None)
    payload = {
        "event_type": event_type[:64],
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "env": settings.analytics_env_label,
        "source": "backend",
        "pathname": _normalize_pathname(request.url.path),
        "tool_slug": (tool_slug or "").strip()[:128] or None,
        "request_id": (request_id or "").strip()[:128] or None,
        "visitor_id": (request.headers.get("x-visitor-id") or "").strip()[:128] or None,
        "ip": _extract_ip(request)[:128],
        "user_agent": (request.headers.get("user-agent") or "").strip()[:1024] or None,
        "referrer": _normalize_referrer(request.headers.get("referer")),
        "language": (request.headers.get("accept-language") or "").strip()[:128]
        or None,
        "status_code": status_code,
        "latency_ms": None,
        "meta": clean_meta,
    }

    timeout = httpx.Timeout(settings.analytics_timeout_ms / 1000.0)

    headers: dict[str, str] = {
        "content-type": "application/json",
    }

    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        headers["x-forwarded-for"] = forwarded_for

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            await client.post(
                f"{base_url.rstrip('/')}/internal/events", json=payload, headers=headers
            )
    except Exception:  # noqa: BLE001
        logger.warning("analytics_emit_failed", extra={"path": request.url.path})
