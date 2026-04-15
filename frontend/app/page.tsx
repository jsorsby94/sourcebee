import type { Metadata } from "next";
import Link from "next/link";

import { AdSlot } from "@/components/tools/ad-slot";
import { Card } from "@/components/ui/card";
import { CATEGORIES, TOOLS } from "@/lib/tool-registry";
import { toAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Simple Tools Hub - Fast, Useful Web Tools",
  description:
    "Use practical web tools for JWT decoding, Base64 conversion, JSON formatting, unit conversion, calculations, and SSL certificate checks.",
  alternates: {
    canonical: toAbsoluteUrl("/"),
  },
  openGraph: {
    title: "Simple Tools Hub - Fast, Useful Web Tools",
    description:
      "Use practical web tools for JWT decoding, Base64 conversion, JSON formatting, unit conversion, calculations, and SSL certificate checks.",
    url: toAbsoluteUrl("/"),
    siteName: "Simple Tools Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simple Tools Hub - Fast, Useful Web Tools",
    description:
      "Use practical web tools for JWT decoding, Base64 conversion, JSON formatting, unit conversion, calculations, and SSL certificate checks.",
  },
};

export default function HomePage() {
  const featuredTools = TOOLS.slice(0, 6);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-200/70 blur-3xl dark:bg-brand-800/40" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">Public developer tools</p>
        <h1 className="font-display mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
          Fast, practical tools for everyday engineering workflows.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300">
          Simple Tools Hub is built for speed, safety, and discoverability. Every tool has dedicated SEO content, strong
          validation, and production-minded architecture.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/tools" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700">
            Browse all tools
          </Link>
          <Link
            href="/categories/security"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Explore security tools
          </Link>
        </div>
      </section>

      <AdSlot label="Homepage top" />

      <section aria-labelledby="featured-tools" className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 id="featured-tools" className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Featured tools
          </h2>
          <Link href="/tools" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
            View all
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <Card key={tool.slug} className="group">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">{tool.category}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 transition group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
                <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tool.shortDescription}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="tool-categories" className="space-y-4">
        <h2 id="tool-categories" className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Categories
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Card key={category.slug}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{category.name}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{category.description}</p>
              <Link href={`/categories/${category.slug}`} className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
                Explore {category.name.toLowerCase()}
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
