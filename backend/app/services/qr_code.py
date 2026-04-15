from io import BytesIO
from typing import Literal

import qrcode
from qrcode.image.svg import SvgImage

from app.core.errors import AppError

ERROR_CORRECTION_MAP = {
    "L": qrcode.constants.ERROR_CORRECT_L,
    "M": qrcode.constants.ERROR_CORRECT_M,
    "Q": qrcode.constants.ERROR_CORRECT_Q,
    "H": qrcode.constants.ERROR_CORRECT_H,
}


def generate_qr_code(
    data: str,
    output_format: Literal["png", "svg"],
    box_size: int,
    border: int,
    error_correction: Literal["L", "M", "Q", "H"],
) -> tuple[bytes, str, str]:
    normalized_data = data.strip()
    if not normalized_data:
        raise AppError(400, "invalid_qr_input", "QR content is required")
    if len(normalized_data) > 2048:
        raise AppError(400, "invalid_qr_input", "QR content is too long")

    if box_size < 1 or box_size > 20:
        raise AppError(400, "invalid_qr_options", "QR box size must be between 1 and 20")
    if border < 0 or border > 12:
        raise AppError(400, "invalid_qr_options", "QR border must be between 0 and 12")

    correction = ERROR_CORRECTION_MAP.get(error_correction)
    if correction is None:
        raise AppError(400, "invalid_qr_options", "Invalid QR error correction level")

    qr = qrcode.QRCode(
        version=None,
        error_correction=correction,
        box_size=box_size,
        border=border,
    )
    qr.add_data(normalized_data)
    qr.make(fit=True)

    buffer = BytesIO()

    if output_format == "png":
        image = qr.make_image(fill_color="black", back_color="white")
        image.save(buffer, format="PNG")
        return buffer.getvalue(), "image/png", "qr-code.png"

    if output_format == "svg":
        image = qr.make_image(image_factory=SvgImage)
        image.save(buffer)
        return buffer.getvalue(), "image/svg+xml", "qr-code.svg"

    raise AppError(400, "invalid_qr_format", "QR output format must be png or svg")
