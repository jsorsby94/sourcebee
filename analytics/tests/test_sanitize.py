from app.sanitize import normalize_pathname, normalize_referrer, sanitize_meta


def test_sanitize_meta_strips_sensitive_keys() -> None:
    payload = {
        "safe": "value",
        "password": "secret",
        "nested": {
            "token_value": "abc",
            "ok": 1,
        },
    }

    result = sanitize_meta(payload)

    assert result == {"safe": "value", "nested": {"ok": 1}}


def test_normalize_pathname_removes_query() -> None:
    assert (
        normalize_pathname("/tools/json-formatter?sort=true") == "/tools/json-formatter"
    )


def test_normalize_referrer_removes_query() -> None:
    assert (
        normalize_referrer("https://example.com/path?q=1") == "https://example.com/path"
    )
