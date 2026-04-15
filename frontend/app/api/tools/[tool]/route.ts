import { NextResponse } from "next/server";

import { TOOL_API_SLUGS, type ToolApiSlug } from "@/lib/tool-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JSON_BODY_BYTES = 32_768;
const MAX_MULTIPART_BODY_BYTES = 26_214_400;

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

export async function POST(request: Request, context: { params: Promise<{ tool: string }> }) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const { tool } = await context.params;

  if (!TOOL_API_SLUGS.includes(tool as ToolApiSlug)) {
    return jsonError(404, "unknown_tool", "Tool endpoint not found", requestId);
  }

  const rawContentType = request.headers.get("content-type") ?? "";
  const contentTypeForCheck = rawContentType.toLowerCase();
  const isMultipart = contentTypeForCheck.includes("multipart/form-data");

  const bodyBuffer = await request.arrayBuffer();
  const bodyBytes = bodyBuffer.byteLength;

  if (!isMultipart && bodyBytes > MAX_JSON_BODY_BYTES) {
    return jsonError(413, "payload_too_large", "Request body exceeds allowed size", requestId);
  }

  if (isMultipart && bodyBytes > MAX_MULTIPART_BODY_BYTES) {
    return jsonError(413, "payload_too_large", "Uploaded payload exceeds allowed size", requestId);
  }

  if (!isMultipart) {
    try {
      JSON.parse(new TextDecoder().decode(bodyBuffer));
    } catch {
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
    return new NextResponse(outputBuffer, {
      status: upstream.status,
      headers: {
        "content-type": upstreamContentType,
        ...(upstreamDisposition ? { "content-disposition": upstreamDisposition } : {}),
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonError(504, "proxy_timeout", "Tool request timed out", requestId);
    }
    return jsonError(502, "backend_unreachable", "Backend service is unavailable", requestId);
  } finally {
    clearTimeout(timeout);
  }
}
