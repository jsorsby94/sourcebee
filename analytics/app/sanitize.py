from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlsplit

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


def sanitize_meta(value: Any, depth: int = 0) -> Any:
    if depth > 4:
        return None

    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            if not isinstance(key, str):
                continue
            if _is_sensitive_key(key):
                continue
            clean_item = sanitize_meta(item, depth + 1)
            if clean_item is not None:
                sanitized[key] = clean_item
        return sanitized

    if isinstance(value, list):
        items: list[Any] = []
        for item in value[:50]:
            clean_item = sanitize_meta(item, depth + 1)
            if clean_item is not None:
                items.append(clean_item)
        return items

    if isinstance(value, (str, int, float, bool)):
        if isinstance(value, str):
            return value[:1024]
        return value

    return None


def normalize_pathname(pathname: str) -> str:
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


def normalize_referrer(referrer: str | None) -> str | None:
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


def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
