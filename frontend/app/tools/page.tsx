import type { Metadata } from "next";

import { AdSlot } from "@/components/tools/ad-slot";
import { ToolsDirectory } from "@/components/tools/tools-directory";
import { toAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "All Tools - Simple Tools Hub",
  description:
    "Browse every tool on Simple Tools Hub including JWT decoder, Base64, JSON formatter, unit converter, calculator, and SSL checker.",
  alternates: {
    canonical: toAbsoluteUrl("/tools"),
  },
  openGraph: {
    title: "All Tools - Simple Tools Hub",
    description:
      "Browse every tool on Simple Tools Hub including JWT decoder, Base64, JSON formatter, unit converter, calculator, and SSL checker.",
    url: toAbsoluteUrl("/tools"),
    siteName: "Simple Tools Hub",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "All Tools - Simple Tools Hub",
    description:
      "Browse every tool on Simple Tools Hub including JWT decoder, Base64, JSON formatter, unit converter, calculator, and SSL checker.",
  },
};

export default function ToolsIndexPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">All Tools</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Search, filter, and launch developer tools quickly. Every tool page includes SEO metadata, supporting copy, FAQ content, and internal links.
        </p>
      </section>

      <AdSlot label="Tools index" />

      <ToolsDirectory />
    </div>
  );
}
