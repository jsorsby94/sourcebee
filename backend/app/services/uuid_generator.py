from uuid import uuid4


def generate_uuids(
    count: int, uppercase: bool, remove_hyphens: bool
) -> dict[str, int | list[str]]:
    values: list[str] = []

    for _ in range(count):
        value = str(uuid4())
        if remove_hyphens:
            value = value.replace("-", "")
        if uppercase:
            value = value.upper()
        values.append(value)

    return {
        "count": count,
        "uuids": values,
    }
