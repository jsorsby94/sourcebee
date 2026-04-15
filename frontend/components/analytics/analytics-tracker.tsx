"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { ANALYTICS_ENABLED, VISITOR_COOKIE_MAX_AGE_SECONDS, VISITOR_COOKIE_NAME } from "@/lib/analytics-config";

function getCookieValue(key: string): string | null {
  const cookie = document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${key}=`));

  if (!cookie) {
    return null;
  }

  const value = cookie.slice(key.length + 1);
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function setVisitorCookie(visitorId: string): void {
  document.cookie = `${VISITOR_COOKIE_NAME}=${encodeURIComponent(visitorId)}; Path=/; Max-Age=${VISITOR_COOKIE_MAX_AGE_SECONDS.toString()}; SameSite=Lax`;
}

function getOrCreateVisitorId(): string {
  const existing = getCookieValue(VISITOR_COOKIE_NAME);
  if (existing) {
    return existing;
  }

  const generated = crypto.randomUUID();
  setVisitorCookie(generated);
  return generated;
}

async function emitClientEvent(payload: {
  event_type: "page_view" | "route_click" | "ui_event";
  pathname: string;
  visitor_id: string;
  tool_slug?: string;
  status_code?: number;
  latency_ms?: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Visitor-ID": payload.visitor_id,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // Analytics should never interrupt UX.
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) {
      return;
    }

    visitorIdRef.current = getOrCreateVisitorId();
  }, []);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) {
      return;
    }

    const visitorId = visitorIdRef.current ?? getOrCreateVisitorId();
    visitorIdRef.current = visitorId;

    void emitClientEvent({
      event_type: "page_view",
      pathname,
      visitor_id: visitorId,
    });
  }, [pathname]);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      let destination: URL;
      try {
        destination = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) {
        return;
      }

      const visitorId = visitorIdRef.current ?? getOrCreateVisitorId();
      visitorIdRef.current = visitorId;

      void emitClientEvent({
        event_type: "route_click",
        pathname: destination.pathname,
        visitor_id: visitorId,
        meta: {
          from_pathname: window.location.pathname,
        },
      });
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return null;
}
