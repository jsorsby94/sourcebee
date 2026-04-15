import ipaddress
import re

import idna

from app.core.errors import AppError

LABEL_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


FORBIDDEN_HOSTNAME_CHARS = {"/", "\\", "@", ":", "?", "#", "%"}


def normalize_hostname(raw_hostname: str) -> str:
    value = raw_hostname.strip().lower().rstrip(".")
    if not value:
        raise AppError(400, "invalid_hostname", "Hostname is required")

    if any(ch in value for ch in FORBIDDEN_HOSTNAME_CHARS):
        raise AppError(
            400, "invalid_hostname", "Hostname must not contain URL components"
        )

    try:
        ipaddress.ip_address(value)
    except ValueError:
        pass
    else:
        raise AppError(400, "ip_not_allowed", "IP addresses are not allowed")

    try:
        ascii_hostname = idna.encode(value, uts46=True).decode("ascii")
    except idna.IDNAError as exc:
        raise AppError(
            400, "invalid_hostname", "Hostname contains invalid IDN characters"
        ) from exc

    if len(ascii_hostname) > 253:
        raise AppError(400, "invalid_hostname", "Hostname is too long")

    labels = ascii_hostname.split(".")
    if len(labels) < 2:
        raise AppError(400, "invalid_hostname", "Hostname must include a public suffix")

    for label in labels:
        if not LABEL_RE.fullmatch(label):
            raise AppError(400, "invalid_hostname", "Hostname format is invalid")

    return ascii_hostname


def is_public_ip(ip_value: str) -> bool:
    ip = ipaddress.ip_address(ip_value)
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped

    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        return False

    return ip.is_global
