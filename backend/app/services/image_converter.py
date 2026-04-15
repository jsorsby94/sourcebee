from io import BytesIO
from typing import Literal

from PIL import Image, UnidentifiedImageError
from pillow_heif import register_heif_opener

from app.core.config import Settings
from app.core.errors import AppError

register_heif_opener()

TargetImageFormat = Literal["png", "jpeg", "webp", "gif", "bmp", "tiff"]

TARGET_FORMAT_MAP: dict[TargetImageFormat, tuple[str, str]] = {
    "png": ("PNG", "image/png"),
    "jpeg": ("JPEG", "image/jpeg"),
    "webp": ("WEBP", "image/webp"),
    "gif": ("GIF", "image/gif"),
    "bmp": ("BMP", "image/bmp"),
    "tiff": ("TIFF", "image/tiff"),
}


def _normalize_target_format(value: str) -> TargetImageFormat:
    normalized = value.strip().lower()
    if normalized == "jpg":
        normalized = "jpeg"

    if normalized not in TARGET_FORMAT_MAP:
        raise AppError(400, "invalid_image_format", "Target format must be png, jpeg, webp, gif, bmp, or tiff")

    return normalized  # type: ignore[return-value]


def convert_image(content: bytes, target_format: str, quality: int, settings: Settings) -> tuple[bytes, str, str]:
    if not content:
        raise AppError(400, "invalid_image", "Image file is required")

    if len(content) > settings.file_request_max_bytes:
        raise AppError(413, "payload_too_large", "Image file exceeds maximum allowed size")

    target = _normalize_target_format(target_format)
    pil_format, mime = TARGET_FORMAT_MAP[target]

    try:
        with Image.open(BytesIO(content)) as source_image:
            width, height = source_image.size
            if width <= 0 or height <= 0:
                raise AppError(400, "invalid_image", "Image has invalid dimensions")

            if width > settings.image_max_dimension or height > settings.image_max_dimension:
                raise AppError(400, "image_too_large", "Image dimensions exceed allowed limits")

            if width * height > settings.image_max_pixels:
                raise AppError(400, "image_too_large", "Image pixel count exceeds allowed limits")

            processed = source_image.copy()

            if pil_format in {"JPEG", "BMP"} and processed.mode in {"RGBA", "LA", "P"}:
                processed = processed.convert("RGB")

            output = BytesIO()
            save_kwargs = {}

            if pil_format in {"JPEG", "WEBP"}:
                safe_quality = max(1, min(100, int(quality)))
                save_kwargs["quality"] = safe_quality

            processed.save(output, format=pil_format, **save_kwargs)
            converted_bytes = output.getvalue()

    except UnidentifiedImageError as exc:
        raise AppError(400, "invalid_image", "Uploaded file is not a supported image") from exc
    except OSError as exc:
        raise AppError(400, "invalid_image", "Failed to decode image file") from exc

    if not converted_bytes:
        raise AppError(500, "conversion_failed", "Failed to convert image")

    extension = "jpg" if target == "jpeg" else target
    filename = f"converted-image.{extension}"
    return converted_bytes, mime, filename
