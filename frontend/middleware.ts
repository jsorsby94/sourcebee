import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const HSTS_VALUE = "max-age=31536000; includeSubDomains";

function isProductionEnv(): boolean {
  const raw =
    process.env.NEXT_PUBLIC_APP_ENV ??
    process.env.APP_ENV ??
    process.env.NODE_ENV ??
    "development";
  const env = raw.toLowerCase();
  return env === "prod" || env === "production";
}

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProtoRaw = request.headers.get("x-forwarded-proto") ?? "";
  const forwardedProto = forwardedProtoRaw.split(",", 1)[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return request.nextUrl.protocol === "https:";
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (isProductionEnv() && isSecureRequest(request)) {
    response.headers.set("Strict-Transport-Security", HSTS_VALUE);
  }

  return response;
}

export const config = {
  matcher: "/:path*",
};
