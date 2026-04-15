from app.core.errors import AppError

LINEAR_FACTORS: dict[str, dict[str, float]] = {
    "length": {
        "mm": 0.001,
        "cm": 0.01,
        "m": 1.0,
        "km": 1000.0,
        "in": 0.0254,
        "ft": 0.3048,
        "yd": 0.9144,
        "mi": 1609.344,
    },
    "weight": {
        "mg": 0.000001,
        "g": 0.001,
        "kg": 1.0,
        "oz": 0.028349523125,
        "lb": 0.45359237,
    },
    "volume": {
        "ml": 0.001,
        "l": 1.0,
        "m3": 1000.0,
        "cup": 0.2365882365,
        "pt": 0.473176473,
        "qt": 0.946352946,
        "gal": 3.785411784,
    },
    "speed": {
        "m/s": 1.0,
        "km/h": 0.2777777778,
        "mph": 0.44704,
        "knot": 0.5144444444,
    },
    "area": {
        "m2": 1.0,
        "km2": 1_000_000.0,
        "ft2": 0.09290304,
        "yd2": 0.83612736,
        "acre": 4046.8564224,
        "ha": 10_000.0,
    },
}


def _convert_temperature(value: float, from_unit: str, to_unit: str) -> float:
    from_key = from_unit.lower()
    to_key = to_unit.lower()

    valid = {"c", "f", "k"}
    if from_key not in valid or to_key not in valid:
        raise AppError(400, "invalid_unit", "Temperature units must be C, F, or K")

    if from_key == "c":
        celsius = value
    elif from_key == "f":
        celsius = (value - 32.0) * 5.0 / 9.0
    else:
        celsius = value - 273.15

    if to_key == "c":
        return celsius
    if to_key == "f":
        return (celsius * 9.0 / 5.0) + 32.0
    return celsius + 273.15


def _convert_linear(category: str, value: float, from_unit: str, to_unit: str) -> float:
    units = LINEAR_FACTORS.get(category)
    if not units:
        raise AppError(400, "invalid_category", "Unsupported conversion category")

    from_key = from_unit.lower()
    to_key = to_unit.lower()

    if from_key not in units or to_key not in units:
        raise AppError(400, "invalid_unit", "Unsupported unit for selected category")

    base_value = value * units[from_key]
    return base_value / units[to_key]


def convert_units(
    category: str, value: float, from_unit: str, to_unit: str
) -> dict[str, object]:
    category_key = category.lower()

    if category_key == "temperature":
        converted = _convert_temperature(value, from_unit, to_unit)
    else:
        converted = _convert_linear(category_key, value, from_unit, to_unit)

    return {
        "category": category_key,
        "input_value": value,
        "from_unit": from_unit,
        "to_unit": to_unit,
        "output_value": converted,
    }
