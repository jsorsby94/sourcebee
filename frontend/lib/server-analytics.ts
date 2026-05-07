import { isIP } from "node:net";

import { VISITOR_COOKIE_NAME } from "@/lib/analytics-config";
import {
  hasAnalyticsConsent as hasAnalyticsConsentCookie,
  parseCookie,
  readAnalyticsConsent,
} from "@/lib/analytics-consent";

const SENSITIVE_KEY_FRAGMENTS = ["input", "token", "password", "data", "file", "content", "payload"];

function isSensitiveKey(key: string): boolean {
  const lowered = key.toLowerCase();
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) => lowered.includes(fragment));
}

function sanitizeMeta(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return null;
  }

  if (Array.isArray(value)) {
    const items: unknown[] = [];
    for (const item of value.slice(0, 50)) {
      const clean = sanitizeMeta(item, depth + 1);
      if (clean !== null) {
        items.push(clean);
      }
    }
    return items;
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        continue;
      }
      const clean = sanitizeMeta(item, depth + 1);
      if (clean !== null) {
        output[key] = clean;
      }
    }
    return output;
  }

  if (typeof value === "string") {
    return value.slice(0, 1024);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return null;
}

function normalizePathname(pathname: string): string {
  const raw = pathname.trim();
  if (!raw) {
    return "/";
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      return parsed.pathname || "/";
    } catch {
      return "/";
    }
  }

  const pathOnly = raw.split("?", 1)[0].split("#", 1)[0].trim();
  if (!pathOnly) {
    return "/";
  }
  if (!pathOnly.startsWith("/")) {
    return `/${pathOnly}`;
  }
  return pathOnly;
}

function normalizeReferrer(referrer: string | null): string | null {
  if (!referrer) {
    return null;
  }

  try {
    const parsed = new URL(referrer);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname || "/"}`;
  } catch {
    return null;
  }
}

function envLabel(): "dev" | "prod" | "test" {
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV ?? "dev").toLowerCase();
  if (appEnv === "prod" || appEnv === "production") {
    return "prod";
  }
  if (appEnv === "test") {
    return "test";
  }
  return "dev";
}

function parseForwardedFor(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const candidate = parts[index];
    if (candidate && isIP(candidate)) {
      return candidate.slice(0, 128);
    }
  }

  return null;
}

function extractIp(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp && isIP(cfConnectingIp)) {
    return cfConnectingIp.slice(0, 128);
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp)) {
    return realIp.slice(0, 128);
  }

  const forwarded = parseForwardedFor(headers.get("x-forwarded-for"));
  if (forwarded) {
    return forwarded;
  }

  return "unknown";
}

export function readVisitorIdCookie(request: Request): string | null {
  return parseCookie(request.headers.get("cookie"), VISITOR_COOKIE_NAME);
}

export function readAnalyticsConsentCookie(request: Request) {
  return readAnalyticsConsent(request.headers.get("cookie"));
}

export function hasAnalyticsConsent(request: Request): boolean {
  return hasAnalyticsConsentCookie(request.headers.get("cookie"));
}

export interface ServerAnalyticsEventInput {
  request: Request;
  eventType: string;
  source: "frontend_client" | "frontend_proxy" | "backend";
  pathname: string;
  toolSlug?: string;
  requestId?: string;
  visitorId?: string;
  statusCode?: number;
  latencyMs?: number;
  meta?: Record<string, unknown>;
}

export async function emitServerAnalyticsEvent(input: ServerAnalyticsEventInput): Promise<void> {
  if (!hasAnalyticsConsent(input.request)) {
    return;
  }

  const analyticsBase = process.env.ANALYTICS_INTERNAL_URL?.trim();
  if (!analyticsBase) {
    return;
  }

  const timeoutMs = Number(process.env.ANALYTICS_TIMEOUT_MS ?? "800");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const forwardedFor = parseForwardedFor(input.request.headers.get("x-forwarded-for"));

  const cleanMetaRaw = sanitizeMeta(input.meta ?? {});
  const cleanMeta = cleanMetaRaw && typeof cleanMetaRaw === "object" && !Array.isArray(cleanMetaRaw) ? cleanMetaRaw : {};

  const payload = {
    event_type: input.eventType.slice(0, 64),
    occurred_at: new Date().toISOString(),
    env: envLabel(),
    source: input.source,
    pathname: normalizePathname(input.pathname),
    tool_slug: input.toolSlug?.slice(0, 128) ?? null,
    request_id: input.requestId?.slice(0, 128) ?? null,
    visitor_id: input.visitorId?.slice(0, 128) ?? null,
    ip: extractIp(input.request.headers),
    user_agent: (input.request.headers.get("user-agent") ?? "").slice(0, 1024) || null,
    referrer: normalizeReferrer(input.request.headers.get("referer")),
    language: (input.request.headers.get("accept-language") ?? "").slice(0, 128) || null,
    status_code: input.statusCode ?? null,
    latency_ms: input.latencyMs ?? null,
    meta: cleanMeta,
  };

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (forwardedFor) {
    headers["x-forwarded-for"] = forwardedFor;
  }

  try {
    await fetch(`${analyticsBase.replace(/\/$/, "")}/internal/events`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    // Analytics must never block primary request paths.
  } finally {
    clearTimeout(timeout);
  }
}
