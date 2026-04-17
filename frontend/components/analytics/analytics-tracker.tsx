"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ANALYTICS_ENABLED, VISITOR_COOKIE_MAX_AGE_SECONDS, VISITOR_COOKIE_NAME } from "@/lib/analytics-config";
import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  parseCookie,
  readAnalyticsConsent,
} from "@/lib/analytics-consent";

function getCookieValue(key: string): string | null {
  return parseCookie(document.cookie, key);
}

function setVisitorCookie(visitorId: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${VISITOR_COOKIE_NAME}=${encodeURIComponent(visitorId)}; Path=/; Max-Age=${VISITOR_COOKIE_MAX_AGE_SECONDS.toString()}; SameSite=Lax${secure}`;
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

function hasAcceptedConsent(): boolean {
  return readAnalyticsConsent(document.cookie) === "accepted";
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
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) {
      return;
    }

    const syncConsent = () => {
      const accepted = hasAcceptedConsent();
      if (!accepted) {
        visitorIdRef.current = null;
      }
      setConsentAccepted(accepted);
    };

    syncConsent();

    const onConsentChange = () => {
      syncConsent();
    };

    window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, onConsentChange);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, onConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!ANALYTICS_ENABLED || !consentAccepted) {
      return;
    }

    const visitorId = visitorIdRef.current ?? getOrCreateVisitorId();
    visitorIdRef.current = visitorId;

    void emitClientEvent({
      event_type: "page_view",
      pathname,
      visitor_id: visitorId,
    });
  }, [consentAccepted, pathname]);

  useEffect(() => {
    if (!ANALYTICS_ENABLED || !consentAccepted) {
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
  }, [consentAccepted]);

  return null;
}
