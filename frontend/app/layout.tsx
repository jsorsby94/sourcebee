import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/layout/theme-provider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";
const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Simple Tools Hub - Fast and Useful Web Tools",
    template: "%s | Simple Tools Hub",
  },
  description:
    "Simple Tools Hub offers fast and practical developer tools including JWT decode, Base64, JSON formatter, unit converter, calculator, and SSL checker.",
  openGraph: {
    title: "Simple Tools Hub",
    description: "Fast and useful SEO-optimized tools for developers and technical teams.",
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Simple Tools Hub",
    description: "Fast and useful SEO-optimized tools for developers and technical teams.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const showDevRibbon = appEnv === "dev";

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {showDevRibbon ? (
          <div className="pointer-events-none fixed left-[-52px] top-5 z-50 w-52 -rotate-45 bg-amber-500/95 py-1 text-center text-xs font-bold tracking-[0.18em] text-black shadow-lg">
            DEV ENVIRONMENT
          </div>
        ) : null}
        <ThemeProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
