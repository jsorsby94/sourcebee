try:
    from app.sanitize import normalize_pathname, normalize_referrer, sanitize_meta
except ModuleNotFoundError:  # pragma: no cover - monorepo root fallback
    from importlib.util import module_from_spec, spec_from_file_location
    from pathlib import Path

    sanitize_path = Path(__file__).resolve().parents[1] / "app" / "sanitize.py"
    spec = spec_from_file_location("analytics_sanitize", sanitize_path)
    if spec is None or spec.loader is None:  # pragma: no cover
        raise
    module = module_from_spec(spec)
    spec.loader.exec_module(module)

    normalize_pathname = module.normalize_pathname
    normalize_referrer = module.normalize_referrer
    sanitize_meta = module.sanitize_meta


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
