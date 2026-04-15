from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image
from pypdf import PdfWriter

from app.main import app


def _make_png_bytes() -> bytes:
    image = Image.new("RGB", (24, 24), color="red")
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def _make_pdf_bytes(pages: int = 1) -> bytes:
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=300, height=300)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def test_jwt_decode_invalid() -> None:
    with TestClient(app) as client:
        response = client.post("/api/tools/jwt-decode", json={"token": "invalid-token"})

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_jwt"


def test_base64_encode() -> None:
    with TestClient(app) as client:
        response = client.post("/api/tools/base64", json={"mode": "encode", "input": "hello"})

    assert response.status_code == 200
    assert response.json()["output"] == "aGVsbG8="


def test_json_formatter_pretty() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/json-formatter",
            json={"operation": "pretty", "input": '{"a":1}', "sort_keys": True},
        )

    assert response.status_code == 200
    assert "\n" in response.json()["output"]


def test_unit_converter() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/unit-converter",
            json={"category": "length", "value": 1, "from_unit": "km", "to_unit": "m"},
        )

    assert response.status_code == 200
    assert response.json()["output_value"] == 1000


def test_calculator_expression() -> None:
    with TestClient(app) as client:
        response = client.post("/api/tools/calculator", json={"expression": "(2+3)*4"})

    assert response.status_code == 200
    assert response.json()["result"] == 20


def test_ssl_checker_rejects_localhost() -> None:
    with TestClient(app) as client:
        response = client.post("/api/tools/ssl-checker", json={"hostname": "localhost"})

    assert response.status_code == 400
    assert response.json()["error"]["code"] in {"invalid_hostname", "blocked_target"}


def test_password_generator_random() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/password-generator",
            json={
                "mode": "random",
                "length": 18,
                "include_lowercase": True,
                "include_uppercase": True,
                "include_numbers": True,
                "include_symbols": True,
                "word_count": 4,
                "separator": "-",
                "capitalize_words": False,
                "append_number": False,
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "random"
    assert data["length"] == 18
    assert len(data["value"]) == 18


def test_color_converter_hex_to_rgba() -> None:
    with TestClient(app) as client:
        response = client.post("/api/tools/color-converter", json={"input": "#14B8A6CC"})

    assert response.status_code == 200
    data = response.json()
    assert data["hex"] == "#14B8A6"
    assert data["hex_alpha"] == "#14B8A6CC"
    assert data["rgb"] == "rgb(20, 184, 166)"


def test_qr_code_png_response() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/qr-code",
            data={
                "data": "https://example.com",
                "output_format": "png",
            },
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/png")
    assert response.headers["cache-control"] == "no-store"
    assert response.content[:8] == b"\x89PNG\r\n\x1a\n"


def test_image_converter_png_to_jpeg() -> None:
    image_bytes = _make_png_bytes()

    with TestClient(app) as client:
        response = client.post(
            "/api/tools/image-converter",
            data={"target_format": "jpeg", "quality": "85"},
            files={"file": ("source.png", image_bytes, "image/png")},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/jpeg")
    assert response.headers["cache-control"] == "no-store"


def test_pdf_merge() -> None:
    pdf_one = _make_pdf_bytes(1)
    pdf_two = _make_pdf_bytes(1)

    with TestClient(app) as client:
        response = client.post(
            "/api/tools/pdf-merge",
            files=[
                ("files", ("one.pdf", pdf_one, "application/pdf")),
                ("files", ("two.pdf", pdf_two, "application/pdf")),
            ],
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.headers["cache-control"] == "no-store"


def test_pdf_split() -> None:
    source = _make_pdf_bytes(3)

    with TestClient(app) as client:
        response = client.post(
            "/api/tools/pdf-split",
            data={"page_range": "1-2"},
            files={"file": ("source.pdf", source, "application/pdf")},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")


def test_pdf_compress() -> None:
    source = _make_pdf_bytes(2)

    with TestClient(app) as client:
        response = client.post(
            "/api/tools/pdf-compress",
            files={"file": ("source.pdf", source, "application/pdf")},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")


def test_password_generator_privacy_headers() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/password-generator",
            json={
                "mode": "passphrase",
                "length": 20,
                "include_lowercase": True,
                "include_uppercase": True,
                "include_numbers": True,
                "include_symbols": True,
                "word_count": 4,
                "separator": "-",
                "capitalize_words": False,
                "append_number": False,
            },
        )

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
