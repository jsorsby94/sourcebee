import base64

from app.core.errors import AppError


def run_base64(mode: str, value: str) -> dict[str, str]:
    if mode == "encode":
        encoded = base64.b64encode(value.encode("utf-8")).decode("ascii")
        return {"mode": "encode", "output": encoded}

    if mode == "decode":
        padded = value.strip() + "=" * (-len(value.strip()) % 4)
        try:
            decoded_bytes = base64.b64decode(padded, validate=True)
            decoded = decoded_bytes.decode("utf-8")
        except Exception as exc:  # noqa: BLE001
            raise AppError(
                400, "invalid_base64", "Input is not valid base64 UTF-8 text"
            ) from exc
        return {"mode": "decode", "output": decoded}

    raise AppError(400, "invalid_mode", "Mode must be encode or decode")
