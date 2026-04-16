import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const HSTS_VALUE = "max-age=31536000; includeSubDomains; preload";
const HTTPS_ENFORCED_HOSTS = new Set(["sourcebee.org", "www.sourcebee.org"]);

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

function getRequestHostname(request: NextRequest): string {
  const forwardedHostRaw = request.headers.get("x-forwarded-host") ?? "";
  const forwardedHost = forwardedHostRaw.split(",", 1)[0]?.trim();
  const hostWithPort = forwardedHost || request.headers.get("host") || request.nextUrl.host;
  return hostWithPort.split(":", 1)[0]?.toLowerCase() ?? "";
}

export function middleware(request: NextRequest) {
  const isProduction = isProductionEnv();
  const isSecure = isSecureRequest(request);
  const hostname = getRequestHostname(request);

  if (isProduction && !isSecure && HTTPS_ENFORCED_HOSTS.has(hostname)) {
    const redirectUrl = new URL(
      `https://${hostname}${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(redirectUrl, 308);
  }

  const response = NextResponse.next();

  if (isProduction && isSecure) {
    response.headers.set("Strict-Transport-Security", HSTS_VALUE);
  }

  return response;
}

export const config = {
  matcher: "/:path*",
};
