from io import BytesIO

from pypdf import PdfReader, PdfWriter

from app.core.config import Settings
from app.core.errors import AppError


def _ensure_pdf(content: bytes) -> None:
    if len(content) < 5 or not content.startswith(b"%PDF"):
        raise AppError(400, "invalid_pdf", "File is not a valid PDF")


def _reader_from_bytes(content: bytes) -> PdfReader:
    _ensure_pdf(content)

    try:
        return PdfReader(BytesIO(content))
    except Exception as exc:  # noqa: BLE001
        raise AppError(400, "invalid_pdf", "Failed to parse PDF document") from exc


def _validate_page_count(reader: PdfReader, settings: Settings) -> None:
    page_count = len(reader.pages)
    if page_count < 1:
        raise AppError(400, "invalid_pdf", "PDF has no pages")
    if page_count > settings.pdf_max_pages:
        raise AppError(
            400, "pdf_too_large", f"PDF page count exceeds {settings.pdf_max_pages}"
        )


def merge_pdfs(contents: list[bytes], settings: Settings) -> bytes:
    if not contents:
        raise AppError(400, "invalid_pdf", "At least one PDF file is required")
    if len(contents) > settings.pdf_merge_max_files:
        raise AppError(
            400,
            "too_many_files",
            f"PDF merge supports up to {settings.pdf_merge_max_files} files",
        )

    writer = PdfWriter()
    total_pages = 0

    for content in contents:
        if len(content) > settings.file_request_max_bytes:
            raise AppError(
                413,
                "payload_too_large",
                "One or more PDF files exceed maximum allowed size",
            )

        reader = _reader_from_bytes(content)
        _validate_page_count(reader, settings)

        for page in reader.pages:
            writer.add_page(page)
            total_pages += 1
            if total_pages > settings.pdf_max_pages:
                raise AppError(
                    400,
                    "pdf_too_large",
                    f"Merged PDF exceeds {settings.pdf_max_pages} pages",
                )

    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def _parse_page_range(page_range: str, total_pages: int) -> list[int]:
    selections: set[int] = set()

    for part in page_range.split(","):
        token = part.strip()
        if not token:
            continue

        if "-" in token:
            start_str, end_str = token.split("-", maxsplit=1)
            try:
                start = int(start_str)
                end = int(end_str)
            except ValueError as exc:
                raise AppError(
                    400, "invalid_page_range", "Page range contains non-numeric values"
                ) from exc

            if start > end:
                raise AppError(
                    400,
                    "invalid_page_range",
                    "Page range start cannot be greater than end",
                )

            for page_number in range(start, end + 1):
                if page_number < 1 or page_number > total_pages:
                    raise AppError(
                        400,
                        "invalid_page_range",
                        "Page range references pages outside document bounds",
                    )
                selections.add(page_number - 1)

        else:
            try:
                page_number = int(token)
            except ValueError as exc:
                raise AppError(
                    400, "invalid_page_range", "Page range contains non-numeric values"
                ) from exc

            if page_number < 1 or page_number > total_pages:
                raise AppError(
                    400,
                    "invalid_page_range",
                    "Page range references pages outside document bounds",
                )
            selections.add(page_number - 1)

    if not selections:
        raise AppError(
            400, "invalid_page_range", "Page range must include at least one page"
        )

    return sorted(selections)


def split_pdf(content: bytes, page_range: str, settings: Settings) -> bytes:
    if len(content) > settings.file_request_max_bytes:
        raise AppError(
            413, "payload_too_large", "PDF file exceeds maximum allowed size"
        )

    reader = _reader_from_bytes(content)
    _validate_page_count(reader, settings)

    selected_pages = _parse_page_range(page_range, len(reader.pages))

    writer = PdfWriter()
    for index in selected_pages:
        writer.add_page(reader.pages[index])

    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def compress_pdf(content: bytes, settings: Settings) -> bytes:
    if len(content) > settings.file_request_max_bytes:
        raise AppError(
            413, "payload_too_large", "PDF file exceeds maximum allowed size"
        )

    reader = _reader_from_bytes(content)
    _validate_page_count(reader, settings)

    writer = PdfWriter()

    for page in reader.pages:
        try:
            page.compress_content_streams(level=6)
        except Exception:  # noqa: BLE001
            pass
        writer.add_page(page)

    output = BytesIO()
    writer.write(output)

    compressed = output.getvalue()
    return compressed if compressed else content
