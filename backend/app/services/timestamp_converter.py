import math
import re
from datetime import datetime, timezone

from app.core.errors import AppError

NUMERIC_TIMESTAMP_RE = re.compile(r"^-?\d+(?:\.\d+)?$")
MILLISECONDS_THRESHOLD = 1_000_000_000_000


def _to_utc_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _from_unix_seconds(seconds: float) -> datetime:
    if not math.isfinite(seconds):
        raise AppError(400, "invalid_timestamp", "Timestamp must be a finite number")

    try:
        return datetime.fromtimestamp(seconds, tz=timezone.utc)
    except (OverflowError, OSError, ValueError) as exc:
        raise AppError(400, "invalid_timestamp", "Timestamp is out of supported range") from exc


def _parse_numeric_timestamp(input_value: str) -> tuple[datetime, str]:
    if "." in input_value:
        return _from_unix_seconds(float(input_value)), "unix_seconds"

    integer_value = int(input_value)
    if abs(integer_value) >= MILLISECONDS_THRESHOLD:
        return _from_unix_seconds(integer_value / 1000.0), "unix_milliseconds"
    return _from_unix_seconds(float(integer_value)), "unix_seconds"


def _parse_iso_timestamp(input_value: str) -> datetime:
    normalized = input_value.strip()
    if normalized.endswith("Z"):
        normalized = f"{normalized[:-1]}+00:00"

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise AppError(
            400,
            "invalid_timestamp",
            "Input must be a Unix timestamp (seconds/ms) or ISO-8601 datetime",
        ) from exc

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def convert_timestamp(input_value: str) -> dict[str, str | int]:
    value = input_value.strip()
    if not value:
        raise AppError(400, "invalid_timestamp", "Timestamp input is required")

    if NUMERIC_TIMESTAMP_RE.fullmatch(value):
        parsed_datetime, detected_type = _parse_numeric_timestamp(value)
    else:
        parsed_datetime = _parse_iso_timestamp(value)
        detected_type = "iso_datetime"

    unix_seconds = int(parsed_datetime.timestamp())
    unix_milliseconds = int(round(parsed_datetime.timestamp() * 1000))

    return {
        "input": input_value,
        "detected_type": detected_type,
        "unix_seconds": unix_seconds,
        "unix_milliseconds": unix_milliseconds,
        "iso_utc": _to_utc_iso(parsed_datetime),
    }
