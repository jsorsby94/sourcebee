from app.core.errors import AppError

CRON_FIELD_RULES: dict[str, tuple[int, int]] = {
    "minute": (0, 59),
    "hour": (0, 23),
    "day_of_month": (1, 31),
    "month": (1, 12),
    "day_of_week": (0, 7),
}


def _parse_int(token: str, field_name: str, minimum: int, maximum: int) -> int:
    if not token.isdigit():
        raise AppError(
            400, "invalid_cron", f"{field_name} value '{token}' must be numeric"
        )

    value = int(token)
    if value < minimum or value > maximum:
        raise AppError(
            400,
            "invalid_cron",
            f"{field_name} value '{token}' must be between {minimum} and {maximum}",
        )
    return value


def _validate_atom(atom: str, field_name: str, minimum: int, maximum: int) -> None:
    if atom == "*":
        return

    if "/" in atom:
        base, step_token = atom.split("/", maxsplit=1)
        if not step_token.isdigit() or int(step_token) <= 0:
            raise AppError(
                400,
                "invalid_cron",
                f"{field_name} step value '{step_token}' must be a positive integer",
            )

        if base == "*":
            return
        if "-" in base:
            start_token, end_token = base.split("-", maxsplit=1)
            start = _parse_int(start_token, field_name, minimum, maximum)
            end = _parse_int(end_token, field_name, minimum, maximum)
            if start > end:
                raise AppError(
                    400,
                    "invalid_cron",
                    f"{field_name} range '{base}' must be ascending",
                )
            return

        _parse_int(base, field_name, minimum, maximum)
        return

    if "-" in atom:
        start_token, end_token = atom.split("-", maxsplit=1)
        start = _parse_int(start_token, field_name, minimum, maximum)
        end = _parse_int(end_token, field_name, minimum, maximum)
        if start > end:
            raise AppError(
                400, "invalid_cron", f"{field_name} range '{atom}' must be ascending"
            )
        return

    _parse_int(atom, field_name, minimum, maximum)


def _validate_field(field_name: str, field_value: str) -> str:
    minimum, maximum = CRON_FIELD_RULES[field_name]
    normalized = field_value.strip().replace(" ", "")
    if not normalized:
        raise AppError(400, "invalid_cron", f"{field_name} field is required")

    for atom in normalized.split(","):
        if not atom:
            raise AppError(
                400, "invalid_cron", f"{field_name} contains an empty list item"
            )
        _validate_atom(atom, field_name, minimum, maximum)

    return normalized


def _describe_field(field_name: str, field_value: str) -> str:
    label = field_name.replace("_", " ")
    if field_value == "*":
        return f"every {label}"
    if field_value.startswith("*/"):
        return f"every {field_value[2:]} {label}"
    return f"{label} {field_value}"


def _build_description(fields: dict[str, str]) -> str:
    parts = [
        _describe_field("minute", fields["minute"]),
        _describe_field("hour", fields["hour"]),
        _describe_field("day_of_month", fields["day_of_month"]),
        _describe_field("month", fields["month"]),
        _describe_field("day_of_week", fields["day_of_week"]),
    ]
    return "Runs with " + ", ".join(parts) + "."


def _parse_expression(expression: str) -> dict[str, str]:
    normalized_expression = " ".join(expression.split())
    if not normalized_expression:
        raise AppError(400, "invalid_cron", "Cron expression is required")

    parts = normalized_expression.split(" ")
    if len(parts) != 5:
        raise AppError(
            400, "invalid_cron", "Cron expression must contain exactly 5 fields"
        )

    minute, hour, day_of_month, month, day_of_week = parts
    return {
        "minute": _validate_field("minute", minute),
        "hour": _validate_field("hour", hour),
        "day_of_month": _validate_field("day_of_month", day_of_month),
        "month": _validate_field("month", month),
        "day_of_week": _validate_field("day_of_week", day_of_week),
    }


def run_cron_tool(
    mode: str,
    expression: str | None,
    minute: str,
    hour: str,
    day_of_month: str,
    month: str,
    day_of_week: str,
) -> dict[str, str]:
    if mode == "parse":
        if expression is None:
            raise AppError(
                400, "invalid_cron", "Expression is required when mode is parse"
            )
        fields = _parse_expression(expression)
    elif mode == "generate":
        fields = {
            "minute": _validate_field("minute", minute),
            "hour": _validate_field("hour", hour),
            "day_of_month": _validate_field("day_of_month", day_of_month),
            "month": _validate_field("month", month),
            "day_of_week": _validate_field("day_of_week", day_of_week),
        }
    else:
        raise AppError(400, "invalid_mode", "Mode must be parse or generate")

    compiled_expression = (
        f"{fields['minute']} {fields['hour']} {fields['day_of_month']}"
        f" {fields['month']} {fields['day_of_week']}"
    )
    description = _build_description(fields)

    return {
        "mode": mode,
        "expression": compiled_expression,
        "description": description,
        **fields,
    }
