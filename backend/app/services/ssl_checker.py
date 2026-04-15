import asyncio
import json
import socket
import ssl
from datetime import datetime, timezone

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import Settings
from app.core.errors import AppError
from app.core.hostname import is_public_ip, normalize_hostname


def _flatten_name(parts: tuple[tuple[tuple[str, str], ...], ...]) -> str:
    values: list[str] = []
    for entry in parts:
        for key, value in entry:
            values.append(f"{key}={value}")
    return ", ".join(values)


def _parse_cert_time(raw_value: str) -> datetime:
    parsed = datetime.strptime(raw_value, "%b %d %H:%M:%S %Y %Z")
    return parsed.replace(tzinfo=timezone.utc)


def _resolve_public_ips(hostname: str) -> list[str]:
    try:
        address_info = socket.getaddrinfo(
            hostname,
            443,
            family=socket.AF_UNSPEC,
            type=socket.SOCK_STREAM,
            proto=socket.IPPROTO_TCP,
        )
    except socket.gaierror as exc:
        raise AppError(400, "dns_resolution_failed", "Could not resolve hostname") from exc

    ips: list[str] = []
    for item in address_info:
        ip = item[4][0]
        if is_public_ip(ip):
            if ip not in ips:
                ips.append(ip)

    if not ips:
        raise AppError(403, "blocked_target", "Hostname does not resolve to public IP addresses")

    return ips


def _perform_tls_handshake(hostname: str, ip: str, timeout_seconds: float) -> dict:
    context = ssl.create_default_context()

    with socket.create_connection((ip, 443), timeout=timeout_seconds) as sock:
        with context.wrap_socket(sock, server_hostname=hostname) as tls_sock:
            tls_sock.settimeout(timeout_seconds)
            certificate = tls_sock.getpeercert()

    if not certificate:
        raise AppError(502, "ssl_unavailable", "No certificate received from target host")

    return certificate


def _fetch_certificate(hostname: str, connect_timeout_seconds: float) -> dict[str, object]:
    public_ips = _resolve_public_ips(hostname)

    last_error: Exception | None = None
    cert: dict | None = None

    for ip in public_ips:
        try:
            cert = _perform_tls_handshake(hostname, ip, connect_timeout_seconds)
            break
        except Exception as exc:  # noqa: BLE001
            last_error = exc

    if cert is None:
        raise AppError(502, "ssl_unavailable", "Failed to retrieve certificate from host") from last_error

    issuer = _flatten_name(cert.get("issuer", ()))
    subject = _flatten_name(cert.get("subject", ()))

    try:
        valid_from = _parse_cert_time(cert["notBefore"])
        valid_to = _parse_cert_time(cert["notAfter"])
    except Exception as exc:  # noqa: BLE001
        raise AppError(502, "ssl_parse_error", "Failed to parse certificate validity dates") from exc

    sans = sorted(
        {
            value
            for kind, value in cert.get("subjectAltName", [])
            if kind == "DNS" and isinstance(value, str)
        }
    )

    days_remaining = (valid_to - datetime.now(timezone.utc)).days

    return {
        "hostname": hostname,
        "issuer": issuer,
        "subject": subject,
        "valid_from": valid_from.isoformat(),
        "valid_to": valid_to.isoformat(),
        "days_remaining": days_remaining,
        "sans": sans,
    }


async def check_ssl_certificate(hostname: str, redis_client: Redis | None, settings: Settings) -> dict[str, object]:
    normalized = normalize_hostname(hostname)
    cache_key = f"cache:ssl:{normalized}"

    if redis_client is not None:
        try:
            cached_value = await redis_client.get(cache_key)
            if cached_value:
                return json.loads(cached_value)
        except RedisError:
            pass

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(_fetch_certificate, normalized, settings.ssl_connect_timeout_seconds),
            timeout=settings.ssl_total_timeout_seconds,
        )
    except asyncio.TimeoutError as exc:
        raise AppError(504, "ssl_timeout", "SSL check timed out") from exc

    if redis_client is not None:
        try:
            await redis_client.set(cache_key, json.dumps(result), ex=settings.ssl_cache_ttl_seconds)
        except RedisError:
            pass

    return result
