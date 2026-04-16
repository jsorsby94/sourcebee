import re
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
        response = client.post(
            "/api/tools/base64", json={"mode": "encode", "input": "hello"}
        )

    assert response.status_code == 200
    assert response.json()["output"] == "aGVsbG8="


def test_json_yaml_json_to_yaml() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/json-yaml",
            json={"mode": "json-to-yaml", "input": '{"b":2,"a":1}', "sort_keys": True},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "json-to-yaml"
    assert data["output"] == "a: 1\nb: 2\n"


def test_json_yaml_yaml_to_json() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/json-yaml",
            json={"mode": "yaml-to-json", "input": "name: sourcebee\ncount: 3"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "yaml-to-json"
    assert '"name": "sourcebee"' in data["output"]
    assert '"count": 3' in data["output"]


def test_hash_generator_sha256() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/hash-generator",
            json={"algorithm": "sha256", "input": "hello"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "sha256"
    assert data["input_length"] == 5
    assert (
        data["digest"]
        == "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    )


def test_uuid_generator_count() -> None:
    with TestClient(app) as client:
        response = client.post("/api/tools/uuid-generator", json={"count": 3})

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 3
    assert len(data["uuids"]) == 3
    for value in data["uuids"]:
        assert re.fullmatch(
            r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}",
            value,
        )


def test_url_encoder_decoder_encode() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/url-encoder-decoder",
            json={"mode": "encode", "input": "hello world?x=1&y=2"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "encode"
    assert data["output"] == "hello%20world%3Fx%3D1%26y%3D2"


def test_timestamp_converter_unix_seconds() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/timestamp-converter",
            json={"input": "1704067200"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["detected_type"] == "unix_seconds"
    assert data["unix_seconds"] == 1704067200
    assert data["unix_milliseconds"] == 1704067200000
    assert data["iso_utc"] == "2024-01-01T00:00:00Z"


def test_json_formatter_pretty() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/json-formatter",
            json={"operation": "pretty", "input": '{"a":1}', "sort_keys": True},
        )

    assert response.status_code == 200
    assert "\n" in response.json()["output"]


def test_cron_parser_mode() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/cron-parser-generator",
            json={"mode": "parse", "expression": "*/15 9-17 * * 1-5"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "parse"
    assert data["expression"] == "*/15 9-17 * * 1-5"
    assert data["minute"] == "*/15"
    assert data["hour"] == "9-17"
    assert data["day_of_week"] == "1-5"


def test_cron_generator_mode() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/cron-parser-generator",
            json={
                "mode": "generate",
                "minute": "0",
                "hour": "12",
                "day_of_month": "*",
                "month": "*",
                "day_of_week": "1-5",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "generate"
    assert data["expression"] == "0 12 * * 1-5"
    assert "hour 12" in data["description"]


def test_unit_converter() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/tools/unit-converter",
            json={"category": "length", "value": 1, "from_unit": "km", "to_unit": "m"},
        )

    assert response.status_code == 200
    assert response.json()["output_value"] == 1000


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
        response = client.post(
            "/api/tools/color-converter", json={"input": "#14B8A6CC"}
        )

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
    assert "source-compressed.pdf" in response.headers["content-disposition"]
    assert int(response.headers["x-original-bytes"]) > 0
    assert int(response.headers["x-compressed-bytes"]) > 0
    assert int(response.headers["x-saved-bytes"]) >= 0
    assert float(response.headers["x-saved-percent"]) >= 0


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
