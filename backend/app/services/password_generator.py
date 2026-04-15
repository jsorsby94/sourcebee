import secrets
import string

from app.core.errors import AppError

WORD_BANK = [
    "anchor",
    "amber",
    "atlas",
    "aurora",
    "binary",
    "breeze",
    "canyon",
    "cipher",
    "cloud",
    "cosmos",
    "crystal",
    "delta",
    "ember",
    "falcon",
    "flux",
    "frost",
    "galaxy",
    "grove",
    "harbor",
    "helix",
    "ivory",
    "jungle",
    "keystone",
    "lagoon",
    "lumen",
    "matrix",
    "meridian",
    "nebula",
    "onyx",
    "orchid",
    "phoenix",
    "pixel",
    "quantum",
    "quartz",
    "raven",
    "sable",
    "summit",
    "tango",
    "thunder",
    "topaz",
    "vector",
    "vertex",
    "violet",
    "whisper",
    "willow",
    "xenon",
    "yonder",
    "zephyr",
]


def _build_random_password(
    length: int,
    include_lowercase: bool,
    include_uppercase: bool,
    include_numbers: bool,
    include_symbols: bool,
) -> str:
    pools: list[str] = []

    if include_lowercase:
        pools.append(string.ascii_lowercase)
    if include_uppercase:
        pools.append(string.ascii_uppercase)
    if include_numbers:
        pools.append(string.digits)
    if include_symbols:
        pools.append("!@#$%^&*()-_=+[]{}:,.?~")

    if not pools:
        raise AppError(
            400,
            "invalid_password_options",
            "At least one character set must be selected",
        )

    if length < len(pools):
        raise AppError(
            400,
            "invalid_password_options",
            "Length is too short for selected character sets",
        )

    rng = secrets.SystemRandom()

    required_chars = [rng.choice(pool) for pool in pools]
    all_chars = "".join(pools)

    remaining_chars = [
        rng.choice(all_chars) for _ in range(length - len(required_chars))
    ]
    result = required_chars + remaining_chars
    rng.shuffle(result)

    return "".join(result)


def _build_passphrase(
    word_count: int,
    separator: str,
    capitalize_words: bool,
    append_number: bool,
) -> str:
    rng = secrets.SystemRandom()

    words = [rng.choice(WORD_BANK) for _ in range(word_count)]
    if capitalize_words:
        words = [word.capitalize() for word in words]

    phrase = separator.join(words)
    if append_number:
        phrase = f"{phrase}{separator}{rng.randrange(10, 100)}"

    return phrase


def generate_password(payload: dict) -> dict[str, object]:
    mode = payload.get("mode", "random")

    if mode == "random":
        value = _build_random_password(
            length=int(payload.get("length", 20)),
            include_lowercase=bool(payload.get("include_lowercase", True)),
            include_uppercase=bool(payload.get("include_uppercase", True)),
            include_numbers=bool(payload.get("include_numbers", True)),
            include_symbols=bool(payload.get("include_symbols", True)),
        )
        return {
            "mode": "random",
            "value": value,
            "length": len(value),
        }

    if mode == "passphrase":
        value = _build_passphrase(
            word_count=int(payload.get("word_count", 4)),
            separator=str(payload.get("separator", "-")),
            capitalize_words=bool(payload.get("capitalize_words", False)),
            append_number=bool(payload.get("append_number", False)),
        )
        return {
            "mode": "passphrase",
            "value": value,
            "length": len(value),
        }

    raise AppError(400, "invalid_password_mode", "Mode must be random or passphrase")
