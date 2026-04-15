from typing import Literal

from fastapi import APIRouter, Depends, File, Form, Request, Response, UploadFile

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.rate_limit import rate_limit_dependency
from app.core.redis import get_redis_from_request
from app.schemas.tools import (
    Base64Request,
    Base64Response,
    CalculatorRequest,
    CalculatorResponse,
    ColorConverterRequest,
    ColorConverterResponse,
    JSONFormatterRequest,
    JSONFormatterResponse,
    JWTDecodeRequest,
    JWTDecodeResponse,
    PasswordGeneratorRequest,
    PasswordGeneratorResponse,
    SSLCheckerRequest,
    SSLCheckerResponse,
    UnitConverterRequest,
    UnitConverterResponse,
)
from app.services.base64 import run_base64
from app.services.calculator import calculate
from app.services.color_converter import convert_color
from app.services.image_converter import convert_image
from app.services.json_tools import format_json
from app.services.jwt import decode_jwt
from app.services.password_generator import generate_password
from app.services.pdf_utils import compress_pdf, merge_pdfs, split_pdf
from app.services.qr_code import generate_qr_code
from app.services.ssl_checker import check_ssl_certificate
from app.services.units import convert_units

router = APIRouter(prefix="/tools", tags=["tools"])


def _binary_response(
    content: bytes,
    media_type: str,
    filename: str,
    extra_headers: dict[str, str] | None = None,
) -> Response:
    headers = {
        "content-disposition": f'attachment; filename="{filename}"',
        "cache-control": "no-store",
    }
    if extra_headers:
        headers.update(extra_headers)

    return Response(
        content=content,
        media_type=media_type,
        headers=headers,
    )


def _sanitize_download_filename(filename: str | None) -> str:
    if not filename:
        return "file"

    # Strip any path segments to avoid reflected path/header injection issues.
    leaf = filename.replace("\\", "/").split("/")[-1].strip()
    if not leaf:
        return "file"

    safe = "".join(
        char
        for char in leaf
        if char.isprintable() and char not in {'"', "\r", "\n", ";", "\x00"}
    ).strip()
    if not safe:
        return "file"

    return safe.strip(".") or "file"


def _compressed_pdf_filename(original_filename: str | None) -> str:
    safe = _sanitize_download_filename(original_filename)
    if "." not in safe:
        return f"{safe}-compressed.pdf"

    stem, extension = safe.rsplit(".", 1)
    safe_stem = stem or "file"
    safe_extension = extension or "pdf"
    return f"{safe_stem}-compressed.{safe_extension}"


async def _read_upload_bytes(file: UploadFile, max_bytes: int) -> bytes:
    try:
        content = await file.read()
    finally:
        await file.close()

    if not content:
        raise AppError(400, "invalid_file", "Uploaded file is empty")

    if len(content) > max_bytes:
        raise AppError(
            413, "payload_too_large", "Uploaded file exceeds maximum allowed size"
        )

    return content


@router.post(
    "/jwt-decode",
    response_model=JWTDecodeResponse,
    dependencies=[Depends(rate_limit_dependency("jwt-decode"))],
)
async def jwt_decode(payload: JWTDecodeRequest) -> JWTDecodeResponse:
    return JWTDecodeResponse(**decode_jwt(payload.token))


@router.post(
    "/base64",
    response_model=Base64Response,
    dependencies=[Depends(rate_limit_dependency("base64"))],
)
async def base64_handler(payload: Base64Request) -> Base64Response:
    return Base64Response(**run_base64(payload.mode, payload.input))


@router.post(
    "/json-formatter",
    response_model=JSONFormatterResponse,
    dependencies=[Depends(rate_limit_dependency("json-formatter"))],
)
async def json_formatter(payload: JSONFormatterRequest) -> JSONFormatterResponse:
    return JSONFormatterResponse(
        **format_json(payload.operation, payload.input, payload.sort_keys)
    )


@router.post(
    "/unit-converter",
    response_model=UnitConverterResponse,
    dependencies=[Depends(rate_limit_dependency("unit-converter"))],
)
async def unit_converter(payload: UnitConverterRequest) -> UnitConverterResponse:
    return UnitConverterResponse(
        **convert_units(
            payload.category, payload.value, payload.from_unit, payload.to_unit
        )
    )


@router.post(
    "/calculator",
    response_model=CalculatorResponse,
    dependencies=[Depends(rate_limit_dependency("calculator"))],
)
async def calculator(payload: CalculatorRequest) -> CalculatorResponse:
    return CalculatorResponse(**calculate(payload.expression))


@router.post(
    "/ssl-checker",
    response_model=SSLCheckerResponse,
    dependencies=[Depends(rate_limit_dependency("ssl-checker", profile="ssl"))],
)
async def ssl_checker(
    payload: SSLCheckerRequest, request: Request
) -> SSLCheckerResponse:
    settings = get_settings()
    redis_client = get_redis_from_request(request)
    result = await check_ssl_certificate(payload.hostname, redis_client, settings)
    return SSLCheckerResponse(**result)


@router.post(
    "/password-generator",
    response_model=PasswordGeneratorResponse,
    dependencies=[Depends(rate_limit_dependency("password-generator"))],
)
async def password_generator(
    payload: PasswordGeneratorRequest,
) -> PasswordGeneratorResponse:
    result = generate_password(payload.model_dump())
    return PasswordGeneratorResponse(**result)


@router.post(
    "/color-converter",
    response_model=ColorConverterResponse,
    dependencies=[Depends(rate_limit_dependency("color-converter"))],
)
async def color_converter(payload: ColorConverterRequest) -> ColorConverterResponse:
    return ColorConverterResponse(**convert_color(payload.input))


@router.post(
    "/qr-code",
    dependencies=[Depends(rate_limit_dependency("qr-code", profile="file"))],
)
async def qr_code(
    data: str = Form(...),
    output_format: Literal["png", "svg"] = Form("png"),
    box_size: int = Form(8),
    border: int = Form(4),
    error_correction: Literal["L", "M", "Q", "H"] = Form("M"),
) -> Response:
    content, media_type, filename = generate_qr_code(
        data=data,
        output_format=output_format,
        box_size=box_size,
        border=border,
        error_correction=error_correction,
    )
    return _binary_response(content, media_type, filename)


@router.post(
    "/image-converter",
    dependencies=[Depends(rate_limit_dependency("image-converter", profile="file"))],
)
async def image_converter(
    file: UploadFile = File(...),
    target_format: str = Form(...),
    quality: int = Form(90),
) -> Response:
    settings = get_settings()
    file_content = await _read_upload_bytes(file, settings.file_request_max_bytes)

    converted_content, media_type, filename = convert_image(
        content=file_content,
        target_format=target_format,
        quality=quality,
        settings=settings,
    )

    return _binary_response(converted_content, media_type, filename)


@router.post(
    "/pdf-merge",
    dependencies=[Depends(rate_limit_dependency("pdf-merge", profile="pdf"))],
)
async def pdf_merge(files: list[UploadFile] = File(...)) -> Response:
    settings = get_settings()

    if len(files) > settings.pdf_merge_max_files:
        raise AppError(
            400,
            "too_many_files",
            f"PDF merge supports up to {settings.pdf_merge_max_files} files",
        )

    file_contents: list[bytes] = []
    for upload in files:
        file_contents.append(
            await _read_upload_bytes(upload, settings.file_request_max_bytes)
        )

    merged = merge_pdfs(file_contents, settings)
    return _binary_response(merged, "application/pdf", "merged.pdf")


@router.post(
    "/pdf-split",
    dependencies=[Depends(rate_limit_dependency("pdf-split", profile="pdf"))],
)
async def pdf_split(
    file: UploadFile = File(...),
    page_range: str = Form(...),
) -> Response:
    settings = get_settings()

    content = await _read_upload_bytes(file, settings.file_request_max_bytes)
    split_result = split_pdf(content, page_range, settings)

    return _binary_response(split_result, "application/pdf", "split.pdf")


@router.post(
    "/pdf-compress",
    dependencies=[Depends(rate_limit_dependency("pdf-compress", profile="pdf"))],
)
async def pdf_compress(file: UploadFile = File(...)) -> Response:
    settings = get_settings()

    original_filename = file.filename
    content = await _read_upload_bytes(file, settings.file_request_max_bytes)
    compressed = compress_pdf(content, settings)
    original_bytes = len(content)
    compressed_bytes = len(compressed)
    saved_bytes = max(original_bytes - compressed_bytes, 0)
    saved_percent = (
        (saved_bytes / original_bytes) * 100 if original_bytes > 0 else 0.0
    )

    return _binary_response(
        compressed,
        "application/pdf",
        _compressed_pdf_filename(original_filename),
        extra_headers={
            "x-original-bytes": str(original_bytes),
            "x-compressed-bytes": str(compressed_bytes),
            "x-saved-bytes": str(saved_bytes),
            "x-saved-percent": f"{saved_percent:.2f}",
        },
    )
