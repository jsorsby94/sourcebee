import json

from app.core.errors import AppError


def format_json(operation: str, input_text: str, sort_keys: bool) -> dict[str, object]:
    try:
        parsed = json.loads(input_text)
    except json.JSONDecodeError as exc:
        message = f"Invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}"
        raise AppError(400, "invalid_json", message) from exc

    if operation == "validate":
        return {"operation": operation, "valid": True, "output": None}

    if operation == "pretty":
        output = json.dumps(parsed, indent=2, ensure_ascii=False, sort_keys=sort_keys)
        return {"operation": operation, "valid": True, "output": output}

    if operation == "minify":
        output = json.dumps(parsed, separators=(",", ":"), ensure_ascii=False, sort_keys=sort_keys)
        return {"operation": operation, "valid": True, "output": output}

    raise AppError(400, "invalid_operation", "Operation must be pretty, minify, or validate")
