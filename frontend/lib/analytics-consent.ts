export const ANALYTICS_CONSENT_COOKIE_NAME =
  process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_COOKIE_NAME ?? "sourcebee_analytics_consent";

const consentCookieMaxAgeRaw = Number(process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_COOKIE_MAX_AGE_SECONDS ?? "31536000");

export const ANALYTICS_CONSENT_COOKIE_MAX_AGE_SECONDS =
  Number.isFinite(consentCookieMaxAgeRaw) && consentCookieMaxAgeRaw > 0 ? Math.floor(consentCookieMaxAgeRaw) : 31_536_000;

export const ANALYTICS_CONSENT_CHANGE_EVENT = "sourcebee:analytics-consent-change";

export type AnalyticsConsentState = "accepted" | "rejected";

export function parseCookie(headerValue: string | null, key: string): string | null {
  if (!headerValue) {
    return null;
  }

  const parts = headerValue.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey || rest.length === 0) {
      continue;
    }

    if (rawKey !== key) {
      continue;
    }

    const value = rest.join("=").trim();
    if (!value) {
      return null;
    }

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

export function parseAnalyticsConsent(value: string | null | undefined): AnalyticsConsentState | null {
  if (!value) {
    return null;
  }

  if (value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
}

export function readAnalyticsConsent(cookieHeader: string | null): AnalyticsConsentState | null {
  return parseAnalyticsConsent(parseCookie(cookieHeader, ANALYTICS_CONSENT_COOKIE_NAME));
}

export function hasAnalyticsConsent(cookieHeader: string | null): boolean {
  return readAnalyticsConsent(cookieHeader) === "accepted";
}
