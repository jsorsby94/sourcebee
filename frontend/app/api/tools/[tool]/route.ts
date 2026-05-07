import { NextResponse } from "next/server";
import { isIP } from "node:net";

import { TOOL_API_SLUGS, type ToolApiSlug } from "@/lib/tool-registry";
import { emitServerAnalyticsEvent, hasAnalyticsConsent, readVisitorIdCookie } from "@/lib/server-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JSON_BODY_BYTES = 32_768;
const MAX_MULTIPART_BODY_BYTES = 26_214_400;
const BINARY_PASSTHROUGH_HEADERS = [
  "x-original-bytes",
  "x-compressed-bytes",
  "x-saved-bytes",
  "x-saved-percent",
] as const;

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

function parseForwardedFor(headerValue: string | null): string | undefined {
  if (!headerValue) {
    return undefined;
  }

  const parts = headerValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const candidate = parts[index];
    if (candidate && isIP(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function resolveClientIp(headers: Headers): string | undefined {
  const cfConnectingIp = headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp && isIP(cfConnectingIp)) {
    return cfConnectingIp;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp)) {
    return realIp;
  }

  return parseForwardedFor(headers.get("x-forwarded-for"));
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

function pickBinaryPassthroughHeaders(upstream: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const headerName of BINARY_PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(headerName);
    if (value) {
      headers[headerName] = value;
    }
  }
  return headers;
}

export async function POST(request: Request, context: { params: Promise<{ tool: string }> }) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  const { tool } = await context.params;
  const pathname = new URL(request.url).pathname;
  const analyticsConsentGranted = hasAnalyticsConsent(request);
  const visitorIdFromHeader = analyticsConsentGranted ? request.headers.get("x-visitor-id")?.trim() || undefined : undefined;
  const visitorId = analyticsConsentGranted ? (visitorIdFromHeader ?? readVisitorIdCookie(request) ?? undefined) : undefined;
  const clientIp = resolveClientIp(request.headers);

  if (!TOOL_API_SLUGS.includes(tool as ToolApiSlug)) {
    await emitServerAnalyticsEvent({
      request,
      eventType: "tool_unknown",
      source: "frontend_proxy",
      pathname,
      toolSlug: tool,
      requestId,
      visitorId,
      statusCode: 404,
      latencyMs: Date.now() - startedAt,
      meta: {},
    });
    return jsonError(404, "unknown_tool", "Tool endpoint not found", requestId);
  }

  const rawContentType = request.headers.get("content-type") ?? "";
  const contentTypeForCheck = rawContentType.toLowerCase();
  const isMultipart = contentTypeForCheck.includes("multipart/form-data");
  const maxBodyBytes = isMultipart ? MAX_MULTIPART_BODY_BYTES : MAX_JSON_BODY_BYTES;

  let requestBody: ArrayBuffer;
  try {
    requestBody = await readBodyWithLimit(request, maxBodyBytes);
  } catch (error) {
    const errorCode = error instanceof BodyReadError ? error.code : "payload_too_large";
    const statusCode = errorCode === "invalid_content_length" ? 400 : 413;
    await emitServerAnalyticsEvent({
      request,
      eventType: "tool_run",
      source: "frontend_proxy",
      pathname,
      toolSlug: tool,
      requestId,
      visitorId,
      statusCode,
      latencyMs: Date.now() - startedAt,
      meta: {
        is_multipart: isMultipart,
        error_code: errorCode,
      },
    });
    if (errorCode === "invalid_content_length") {
      return jsonError(400, "invalid_content_length", "Invalid Content-Length header", requestId);
    }
    const message = isMultipart
      ? "Uploaded payload exceeds allowed size"
      : "Request body exceeds allowed size";
    return jsonError(413, "payload_too_large", message, requestId);
  }

  const bodyBytes = requestBody.byteLength;

  if (!isMultipart) {
    try {
      JSON.parse(new TextDecoder().decode(new Uint8Array(requestBody)));
    } catch {
      await emitServerAnalyticsEvent({
        request,
        eventType: "tool_run",
        source: "frontend_proxy",
        pathname,
        toolSlug: tool,
        requestId,
        visitorId,
        statusCode: 400,
        latencyMs: Date.now() - startedAt,
        meta: {
          is_multipart: false,
          request_bytes: bodyBytes,
          error_code: "invalid_json",
        },
      });
      return jsonError(400, "invalid_json", "Request body must be valid JSON", requestId);
    }
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8000";
  const timeoutMs = Number(process.env.PROXY_TIMEOUT_MS ?? "10000");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(`${backendUrl}/api/tools/${tool}`, {
      method: "POST",
      headers: {
        "x-request-id": requestId,
        ...(visitorId ? { "x-visitor-id": visitorId } : {}),
        ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
        ...(rawContentType ? { "content-type": rawContentType } : {}),
      },
      body: requestBody,
      signal: controller.signal,
      cache: "no-store",
    });

    const upstreamContentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const upstreamDisposition = upstream.headers.get("content-disposition");

    if (upstreamContentType.includes("application/json")) {
      const text = await upstream.text();
      const responseBytes = new TextEncoder().encode(text).byteLength;
      await emitServerAnalyticsEvent({
        request,
        eventType: "tool_run",
        source: "frontend_proxy",
        pathname,
        toolSlug: tool,
        requestId,
        visitorId,
        statusCode: upstream.status,
        latencyMs: Date.now() - startedAt,
        meta: {
          is_multipart: isMultipart,
          request_bytes: bodyBytes,
          response_bytes: responseBytes,
          response_content_type: upstreamContentType,
        },
      });
      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          "content-type": upstreamContentType,
          "cache-control": "no-store",
          "x-request-id": requestId,
        },
      });
    }

    const outputBuffer = await upstream.arrayBuffer();
    await emitServerAnalyticsEvent({
      request,
      eventType: "tool_run",
      source: "frontend_proxy",
      pathname,
      toolSlug: tool,
      requestId,
      visitorId,
      statusCode: upstream.status,
      latencyMs: Date.now() - startedAt,
      meta: {
        is_multipart: isMultipart,
        request_bytes: bodyBytes,
        response_bytes: outputBuffer.byteLength,
        response_content_type: upstreamContentType,
      },
    });
    return new NextResponse(outputBuffer, {
      status: upstream.status,
      headers: {
        "content-type": upstreamContentType,
        ...(upstreamDisposition ? { "content-disposition": upstreamDisposition } : {}),
        ...pickBinaryPassthroughHeaders(upstream),
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      await emitServerAnalyticsEvent({
        request,
        eventType: "tool_run",
        source: "frontend_proxy",
        pathname,
        toolSlug: tool,
        requestId,
        visitorId,
        statusCode: 504,
        latencyMs: Date.now() - startedAt,
        meta: {
          is_multipart: isMultipart,
          request_bytes: bodyBytes,
          error_code: "proxy_timeout",
        },
      });
      return jsonError(504, "proxy_timeout", "Tool request timed out", requestId);
    }
    await emitServerAnalyticsEvent({
      request,
      eventType: "tool_run",
      source: "frontend_proxy",
      pathname,
      toolSlug: tool,
      requestId,
      visitorId,
      statusCode: 502,
      latencyMs: Date.now() - startedAt,
      meta: {
        is_multipart: isMultipart,
        request_bytes: bodyBytes,
        error_code: "backend_unreachable",
      },
    });
    return jsonError(502, "backend_unreachable", "Backend service is unavailable", requestId);
  } finally {
    clearTimeout(timeout);
  }
}
