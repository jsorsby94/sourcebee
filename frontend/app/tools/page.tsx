import type { Metadata } from "next";

import { AdSlot } from "@/components/tools/ad-slot";
import { ToolsDirectory } from "@/components/tools/tools-directory";
import { toAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "All Tools",
  description:
    "Browse every Sourcebee tool with fast search, category filtering, and direct access to secure developer workflows.",
  alternates: {
    canonical: toAbsoluteUrl("/tools"),
  },
  openGraph: {
    title: "All Tools - Sourcebee",
    description:
      "Browse every Sourcebee tool with fast search, category filtering, and direct access to secure developer workflows.",
    url: toAbsoluteUrl("/tools"),
    siteName: "Sourcebee",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "All Tools - Sourcebee",
    description:
      "Browse every Sourcebee tool with fast search, category filtering, and direct access to secure developer workflows.",
  },
};

export default function ToolsIndexPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-[#111722]/90">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">All Tools</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Search and filter the full Sourcebee catalog. Every tool page includes technical guidance, FAQ content, and related links.
        </p>
      </section>

      <AdSlot label="Tools index" />

      <ToolsDirectory />
    </div>
  );
}
