import base64
import json
from datetime import datetime, timezone
from typing import Any

from app.core.errors import AppError


MAX_SEGMENT_LENGTH = 4096


def _decode_base64url_segment(segment: str, segment_name: str) -> dict[str, Any]:
    if len(segment) > MAX_SEGMENT_LENGTH:
        raise AppError(400, "invalid_jwt", f"JWT {segment_name} segment is too large")

    padded = segment + "=" * (-len(segment) % 4)

    try:
        raw = base64.urlsafe_b64decode(padded.encode("ascii"))
    except Exception as exc:  # noqa: BLE001
        raise AppError(400, "invalid_jwt", f"JWT {segment_name} segment is not valid base64url") from exc

    try:
        parsed = json.loads(raw.decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise AppError(400, "invalid_jwt", f"JWT {segment_name} segment is not valid JSON") from exc

    if not isinstance(parsed, dict):
        raise AppError(400, "invalid_jwt", f"JWT {segment_name} segment must decode to an object")

    return parsed


def _to_datetime_if_timestamp(value: Any) -> datetime | None:
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value), tz=timezone.utc)
        except Exception:  # noqa: BLE001
            return None
    return None


def decode_jwt(token: str) -> dict[str, Any]:
    parts = token.strip().split(".")
    if len(parts) not in {2, 3}:
        raise AppError(400, "invalid_jwt", "JWT must have header.payload[.signature] format")

    header = _decode_base64url_segment(parts[0], "header")
    payload = _decode_base64url_segment(parts[1], "payload")

    issued_at = _to_datetime_if_timestamp(payload.get("iat"))
    expires_at = _to_datetime_if_timestamp(payload.get("exp"))

    is_expired: bool | None = None
    if expires_at is not None:
        is_expired = expires_at <= datetime.now(timezone.utc)

    return {
        "header": header,
        "payload": payload,
        "issued_at": issued_at,
        "expires_at": expires_at,
        "is_expired": is_expired,
    }
