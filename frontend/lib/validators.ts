const HOSTNAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function validateRequiredText(value: string, label: string): string | null {
  if (!value.trim()) {
    return `${label} is required.`;
  }
  return null;
}

export function validateHostnameClient(hostname: string): string | null {
  const value = hostname.trim().toLowerCase();

  if (!value) {
    return "Hostname is required.";
  }

  if (value.length > 253) {
    return "Hostname is too long.";
  }

  if (["/", "\\", "@", ":", "?", "#"].some((ch) => value.includes(ch))) {
    return "Enter a hostname only, not a URL.";
  }

  if (!HOSTNAME_RE.test(value)) {
    return "Hostname format is invalid.";
  }

  return null;
}
