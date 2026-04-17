import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { AnalyticsConsentBanner } from "@/components/analytics/analytics-consent-banner";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();
const appEnvRaw = (
  process.env.APP_ENV ??
  process.env.NEXT_PUBLIC_APP_ENV ??
  process.env.NODE_ENV ??
  "development"
).toLowerCase();

export const viewport: Viewport = {
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#f8fafc",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#020617",
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Sourcebee",
  title: {
    default: "Sourcebee",
    template: "%s | Sourcebee",
  },
  description:
    "Sourcebee is a fast, precision-focused hive of developer tools for decoding, formatting, conversion, and security diagnostics.",
  alternates: {
    canonical: siteUrl,
  },
  manifest: "/favicon/light/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon/light/favicon.ico",
      },
      {
        url: "/favicon/light/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon/light/web-app-manifest-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    shortcut: [{ url: "/favicon/light/favicon.ico" }],
    apple: [{ url: "/favicon/light/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Sourcebee",
    description: "A high-performance hive of precise developer tools built for real engineering workflows.",
    type: "website",
    url: siteUrl,
    siteName: "Sourcebee",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sourcebee",
    description: "A high-performance hive of precise developer tools built for real engineering workflows.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const showDevRibbon = appEnvRaw === "dev" || appEnvRaw === "development" || appEnvRaw === "local";

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {showDevRibbon ? (
          <div className="pointer-events-none fixed left-[-52px] top-5 z-50 w-52 -rotate-45 border border-black/25 bg-amber-500/95 py-1 text-center text-xs font-bold tracking-[0.18em] text-black shadow-lg">
            DEV ENVIRONMENT
          </div>
        ) : null}
        <ThemeProvider>
          <AnalyticsTracker />
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          <Footer />
          <AnalyticsConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
