from urllib.parse import quote, unquote_to_bytes

from app.core.errors import AppError


def run_url_codec(mode: str, value: str) -> dict[str, str]:
    if mode == "encode":
        return {"mode": "encode", "output": quote(value, safe="-_.~")}

    if mode == "decode":
        try:
            decoded = unquote_to_bytes(value).decode("utf-8")
        except UnicodeDecodeError as exc:
            raise AppError(
                400, "invalid_url_encoding", "Input is not valid UTF-8 URL-encoded text"
            ) from exc
        return {"mode": "decode", "output": decoded}

    raise AppError(400, "invalid_mode", "Mode must be encode or decode")
