import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/layout/theme-provider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000";
const appEnvRaw = (
  process.env.APP_ENV ??
  process.env.NEXT_PUBLIC_APP_ENV ??
  process.env.NODE_ENV ??
  "development"
).toLowerCase();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sourcebee",
    template: "%s | Sourcebee",
  },
  description:
    "Sourcebee is a fast, precision-focused hive of developer tools for decoding, formatting, conversion, and security diagnostics.",
  manifest: "/favicon/light/site.webmanifest",
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
  icons: {
    icon: [
      {
        url: "/favicon/light/favicon.ico",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/dark/favicon.ico",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon/light/favicon.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/dark/favicon.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/web-app-manifest-192x192.png",
        type: "image/png",
        sizes: "192x192",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/web-app-manifest-192x192-dark.png",
        type: "image/png",
        sizes: "192x192",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: [
      {
        url: "/favicon/light/favicon.ico",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/dark/favicon.ico",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/favicon/light/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/dark/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  openGraph: {
    title: "Sourcebee",
    description: "A high-performance hive of precise developer tools built for real engineering workflows.",
    type: "website",
    url: siteUrl,
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
      <head>
        <link rel="manifest" href="/favicon/dark/site.webmanifest" media="(prefers-color-scheme: dark)" />
      </head>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
