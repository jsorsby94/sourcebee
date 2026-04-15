import { NextResponse } from "next/server";

import { TOOL_API_SLUGS, type ToolApiSlug } from "@/lib/tool-registry";
import { emitServerAnalyticsEvent, readVisitorIdCookie } from "@/lib/server-analytics";

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
  const visitorIdFromHeader = request.headers.get("x-visitor-id")?.trim() || undefined;
  const visitorId = visitorIdFromHeader ?? readVisitorIdCookie(request) ?? undefined;

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

  const bodyBuffer = await request.arrayBuffer();
  const bodyBytes = bodyBuffer.byteLength;

  if (!isMultipart && bodyBytes > MAX_JSON_BODY_BYTES) {
    await emitServerAnalyticsEvent({
      request,
      eventType: "tool_run",
      source: "frontend_proxy",
      pathname,
      toolSlug: tool,
      requestId,
      visitorId,
      statusCode: 413,
      latencyMs: Date.now() - startedAt,
      meta: {
        is_multipart: false,
        request_bytes: bodyBytes,
        error_code: "payload_too_large",
      },
    });
    return jsonError(413, "payload_too_large", "Request body exceeds allowed size", requestId);
  }

  if (isMultipart && bodyBytes > MAX_MULTIPART_BODY_BYTES) {
    await emitServerAnalyticsEvent({
      request,
      eventType: "tool_run",
      source: "frontend_proxy",
      pathname,
      toolSlug: tool,
      requestId,
      visitorId,
      statusCode: 413,
      latencyMs: Date.now() - startedAt,
      meta: {
        is_multipart: true,
        request_bytes: bodyBytes,
        error_code: "payload_too_large",
      },
    });
    return jsonError(413, "payload_too_large", "Uploaded payload exceeds allowed size", requestId);
  }

  if (!isMultipart) {
    try {
      JSON.parse(new TextDecoder().decode(bodyBuffer));
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
        ...(rawContentType ? { "content-type": rawContentType } : {}),
      },
      body: bodyBuffer,
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
