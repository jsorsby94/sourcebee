import re

from app.core.errors import AppError

HEX_SHORT_RE = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4})$")
HEX_LONG_RE = re.compile(r"^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")
RGB_RE = re.compile(r"^rgba?\(([^)]+)\)$", re.IGNORECASE)


def _clamp_channel(value: int) -> int:
    if value < 0 or value > 255:
        raise AppError(400, "invalid_color", "RGB channel must be between 0 and 255")
    return value


def _parse_alpha(value: str) -> int:
    try:
        alpha_float = float(value)
    except ValueError as exc:
        raise AppError(400, "invalid_color", "Alpha value is invalid") from exc

    if alpha_float < 0 or alpha_float > 1:
        raise AppError(400, "invalid_color", "Alpha must be between 0 and 1")

    return round(alpha_float * 255)


def _parse_rgb_channel(value: str) -> int:
    try:
        parsed = int(value)
    except ValueError as exc:
        raise AppError(400, "invalid_color", "RGB values must be integers") from exc
    return _clamp_channel(parsed)


def _parse_color(input_value: str) -> tuple[int, int, int, int]:
    normalized = input_value.strip()

    if HEX_SHORT_RE.fullmatch(normalized):
        value = normalized[1:]
        if len(value) == 3:
            r, g, b = [int(ch * 2, 16) for ch in value]
            return r, g, b, 255
        r, g, b, a = [int(ch * 2, 16) for ch in value]
        return r, g, b, a

    if HEX_LONG_RE.fullmatch(normalized):
        value = normalized[1:]
        if len(value) == 6:
            return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), 255
        return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), int(value[6:8], 16)

    rgb_match = RGB_RE.fullmatch(normalized)
    if rgb_match:
        parts = [part.strip() for part in rgb_match.group(1).split(",")]

        if len(parts) == 3:
            r, g, b = [_parse_rgb_channel(part) for part in parts]
            return r, g, b, 255
        if len(parts) == 4:
            r, g, b = [_parse_rgb_channel(part) for part in parts[:3]]
            a = _parse_alpha(parts[3])
            return r, g, b, a

        raise AppError(400, "invalid_color", "RGB(A) input must contain 3 or 4 channels")

    raise AppError(400, "invalid_color", "Supported formats: #RGB, #RRGGBB, #RGBA, #RRGGBBAA, rgb(), rgba()")


def convert_color(input_value: str) -> dict[str, str]:
    r, g, b, a = _parse_color(input_value)

    alpha_float = a / 255
    alpha_str = f"{alpha_float:.3f}".rstrip("0").rstrip(".")

    return {
        "input": input_value,
        "hex": f"#{r:02X}{g:02X}{b:02X}",
        "hex_alpha": f"#{r:02X}{g:02X}{b:02X}{a:02X}",
        "rgb": f"rgb({r}, {g}, {b})",
        "rgba": f"rgba({r}, {g}, {b}, {alpha_str})",
    }
