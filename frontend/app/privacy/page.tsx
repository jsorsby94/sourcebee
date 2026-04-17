import type { Metadata } from "next";

import { ANALYTICS_CONSENT_COOKIE_NAME } from "@/lib/analytics-consent";
import { VISITOR_COOKIE_NAME } from "@/lib/analytics-config";
import { toAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Sourcebee privacy and cookie policy for analytics consent, telemetry scope, and data handling.",
  alternates: {
    canonical: toAbsoluteUrl("/privacy"),
  },
  openGraph: {
    title: "Sourcebee Privacy",
    description: "Privacy and cookie details for Sourcebee analytics, visitor IDs, and telemetry safeguards.",
    url: toAbsoluteUrl("/privacy"),
    siteName: "Sourcebee",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sourcebee Privacy",
    description: "Privacy and cookie details for Sourcebee analytics, visitor IDs, and telemetry safeguards.",
  },
};

export default function PrivacyPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-sm dark:border-white/10 dark:bg-[#111722]/90 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">Privacy</p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Privacy and Cookie Policy
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Sourcebee is designed to avoid collecting tool content. We only process limited operational telemetry after consent for
          analytics cookies.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#111722]/90">
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">Essential Cookie</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800 dark:bg-white/10 dark:text-slate-100">
              {ANALYTICS_CONSENT_COOKIE_NAME}
            </code>{" "}
            stores your cookie choice (`accepted` or `rejected`) so we can honor it.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#111722]/90">
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">Analytics Cookie</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800 dark:bg-white/10 dark:text-slate-100">
              {VISITOR_COOKIE_NAME}
            </code>{" "}
            is created only after you click Accept and is used for anonymous product analytics.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-[#111722]/90">
        <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">Consent Behavior</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>Before Accept: analytics requests are not sent and no analytics visitor cookie is set.</li>
          <li>If you click Accept: visitor ID cookie is created and analytics events start for product measurement.</li>
          <li>If you click Reject: no analytics cookie is set and app functionality continues normally.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-[#111722]/90">
        <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">Telemetry Scope</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Stored</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>Client IP address, pathname, event type/source, status code, and latency</li>
              <li>User-agent, referrer origin/path (query removed), language, request ID, visitor ID</li>
              <li>Non-sensitive metadata fields required for operations</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Never Stored</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>Tool request bodies and uploaded image/PDF file contents</li>
              <li>Generated passwords or passphrases</li>
              <li>QR payload text and binary response payload content</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-300/70 bg-amber-50/90 p-6 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10">
        <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-50">IP Address Notice</h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          IP addresses are treated as personal data in many jurisdictions, including GDPR. We disclose this collection here for
          transparency. Consent and legal obligations can vary by region.
        </p>
      </section>
    </div>
  );
}
