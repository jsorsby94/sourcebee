import hashlib

from app.core.errors import AppError

SUPPORTED_HASH_ALGORITHMS = {
    "md5",
    "sha1",
    "sha224",
    "sha256",
    "sha384",
    "sha512",
}


def generate_hash(algorithm: str, input_value: str) -> dict[str, str | int]:
    normalized = algorithm.strip().lower()
    if normalized not in SUPPORTED_HASH_ALGORITHMS:
        raise AppError(
            400,
            "invalid_algorithm",
            "Algorithm must be one of: md5, sha1, sha224, sha256, sha384, sha512",
        )

    hasher = hashlib.new(normalized)
    hasher.update(input_value.encode("utf-8"))

    return {
        "algorithm": normalized,
        "input_length": len(input_value),
        "digest": hasher.hexdigest(),
    }
