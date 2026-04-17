"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ANALYTICS_ENABLED, VISITOR_COOKIE_MAX_AGE_SECONDS, VISITOR_COOKIE_NAME } from "@/lib/analytics-config";
import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  ANALYTICS_CONSENT_COOKIE_MAX_AGE_SECONDS,
  ANALYTICS_CONSENT_COOKIE_NAME,
  parseCookie,
  readAnalyticsConsent,
  type AnalyticsConsentState,
} from "@/lib/analytics-consent";

function readCookieValue(key: string): string | null {
  return parseCookie(document.cookie, key);
}

function readConsentFromDocument(): AnalyticsConsentState | null {
  return readAnalyticsConsent(document.cookie);
}

function setConsentCookie(value: AnalyticsConsentState): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ANALYTICS_CONSENT_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${ANALYTICS_CONSENT_COOKIE_MAX_AGE_SECONDS.toString()}; SameSite=Lax${secure}`;
}

function setVisitorCookie(visitorId: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${VISITOR_COOKIE_NAME}=${encodeURIComponent(visitorId)}; Path=/; Max-Age=${VISITOR_COOKIE_MAX_AGE_SECONDS.toString()}; SameSite=Lax${secure}`;
}

function clearVisitorCookie(): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${VISITOR_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function notifyConsentChanged(): void {
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGE_EVENT));
}

export function AnalyticsConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) {
      return;
    }

    const consent = readConsentFromDocument();
    if (consent === "accepted" || consent === "rejected") {
      setIsVisible(false);
      return;
    }

    // Remove legacy analytics identity cookie until explicit consent is provided.
    clearVisitorCookie();
    setIsVisible(true);
  }, []);

  if (!ANALYTICS_ENABLED || !isVisible) {
    return null;
  }

  const handleAccept = () => {
    const existingVisitorId = readCookieValue(VISITOR_COOKIE_NAME);
    const visitorId = existingVisitorId || crypto.randomUUID();
    setConsentCookie("accepted");
    setVisitorCookie(visitorId);
    setIsVisible(false);
    notifyConsentChanged();
  };

  const handleReject = () => {
    setConsentCookie("rejected");
    clearVisitorCookie();
    setIsVisible(false);
    notifyConsentChanged();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 sm:bottom-4">
      <section
        role="dialog"
        aria-label="Cookie consent"
        className="pointer-events-auto mx-auto w-full max-w-4xl rounded-2xl border border-slate-300/85 bg-white/95 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.5)] backdrop-blur-md dark:border-white/15 dark:bg-[#0f1622]/95"
      >
        <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Cookies</p>
            <p className="mt-1 text-xs text-slate-700 sm:text-sm dark:text-slate-200">
              We use analytics cookies to improve the product. No personal content is stored.{" "}
              <Link href="/privacy" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
                Learn more
              </Link>
              .
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={handleAccept} className="min-h-9 px-3 py-1.5 text-xs sm:text-sm">
              Accept
            </Button>
            <Button variant="secondary" onClick={handleReject} className="min-h-9 px-3 py-1.5 text-xs sm:text-sm">
              Reject
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
