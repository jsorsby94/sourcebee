import { NextResponse } from "next/server";

import { ANALYTICS_ENABLED } from "@/lib/analytics-config";
import { emitServerAnalyticsEvent, hasAnalyticsConsent, readVisitorIdCookie } from "@/lib/server-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;
const ALLOWED_EVENT_TYPES = new Set(["page_view", "route_click", "ui_event"]);

class BodyReadError extends Error {
  code: "invalid_content_length" | "payload_too_large";

  constructor(code: "invalid_content_length" | "payload_too_large") {
    super(code);
    this.code = code;
  }
}

function parseContentLength(headers: Headers): number | undefined {
  const raw = headers.get("content-length");
  if (raw === null) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new BodyReadError("invalid_content_length");
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BodyReadError("invalid_content_length");
  }

  return parsed;
}

async function readBodyWithLimit(request: Request, maxBytes: number): Promise<ArrayBuffer> {
  const declaredLength = parseContentLength(request.headers);
  if (declaredLength !== undefined && declaredLength > maxBytes) {
    throw new BodyReadError("payload_too_large");
  }

  const stream = request.body;
  if (!stream) {
    return new ArrayBuffer(0);
  }

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // no-op
      }
      throw new BodyReadError("payload_too_large");
    }

    chunks.push(value);
  }

  const output = new ArrayBuffer(totalBytes);
  const view = new Uint8Array(output);
  let offset = 0;
  for (const chunk of chunks) {
    view.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

function jsonError(status: number, code: string, message: string, requestId: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        request_id: requestId,
      },
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    },
  );
}

function normalizePathname(pathname: string): string {
  const raw = pathname.trim();
  if (!raw) {
    return "/";
  }

  const pathOnly = raw.split("?", 1)[0].split("#", 1)[0].trim();
  if (!pathOnly) {
    return "/";
  }
  return pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  if (!ANALYTICS_ENABLED) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    });
  }

  if (!hasAnalyticsConsent(request)) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    });
  }

  let bodyBuffer: ArrayBuffer;
  try {
    bodyBuffer = await readBodyWithLimit(request, MAX_BODY_BYTES);
  } catch (error) {
    const errorCode = error instanceof BodyReadError ? error.code : "payload_too_large";
    if (errorCode === "invalid_content_length") {
      return jsonError(400, "invalid_content_length", "Invalid Content-Length header", requestId);
    }
    return jsonError(413, "payload_too_large", "Analytics payload exceeds allowed size", requestId);
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(new Uint8Array(bodyBuffer)));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonError(400, "invalid_payload", "Analytics payload must be a JSON object", requestId);
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return jsonError(400, "invalid_json", "Analytics payload must be valid JSON", requestId);
  }

  const eventType = typeof payload.event_type === "string" ? payload.event_type.trim() : "";
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return jsonError(400, "invalid_event_type", "Unsupported analytics event type", requestId);
  }

  const pathnameRaw = typeof payload.pathname === "string" ? payload.pathname : "/";
  const pathname = normalizePathname(pathnameRaw);

  const toolSlugRaw = typeof payload.tool_slug === "string" ? payload.tool_slug.trim() : "";
  const toolSlug = toolSlugRaw ? toolSlugRaw.slice(0, 128) : undefined;

  const statusCodeValue = typeof payload.status_code === "number" ? payload.status_code : undefined;
  const statusCode =
    statusCodeValue !== undefined && Number.isInteger(statusCodeValue) && statusCodeValue >= 100 && statusCodeValue <= 599
      ? statusCodeValue
      : undefined;

  const latencyValue = typeof payload.latency_ms === "number" ? payload.latency_ms : undefined;
  const latencyMs = latencyValue !== undefined && Number.isFinite(latencyValue) && latencyValue >= 0 ? latencyValue : undefined;

  const metaValue = payload.meta;
  const meta = metaValue && typeof metaValue === "object" && !Array.isArray(metaValue) ? (metaValue as Record<string, unknown>) : {};

  const providedVisitorId = typeof payload.visitor_id === "string" ? payload.visitor_id.trim() : "";
  const headerVisitorId = request.headers.get("x-visitor-id")?.trim() ?? "";
  const cookieVisitorId = readVisitorIdCookie(request) ?? "";
  const visitorId = (providedVisitorId || headerVisitorId || cookieVisitorId || crypto.randomUUID()).slice(0, 128);

  await emitServerAnalyticsEvent({
    request,
    eventType,
    source: "frontend_client",
    pathname,
    toolSlug,
    requestId,
    visitorId,
    statusCode,
    latencyMs,
    meta,
  });

  return new NextResponse(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
      "x-request-id": requestId,
    },
  });
}
