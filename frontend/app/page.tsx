import type { Metadata } from "next";
import Link from "next/link";

import { AdSlot } from "@/components/tools/ad-slot";
import { ToolCard } from "@/components/tools/tool-card";
import { CATEGORIES, TOOLS } from "@/lib/tool-registry";
import { toAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sourcebee | Precision Developer Tools",
  description:
    "Sourcebee is a fast, precise hive of developer tools for JWT decode, Base64, JSON formatting, conversion workflows, and security diagnostics.",
  alternates: {
    canonical: toAbsoluteUrl("/"),
  },
  openGraph: {
    title: "Sourcebee - Precision Developer Tools",
    description:
      "A high-performance hive of developer tools designed for speed, reliability, and technical precision.",
    url: toAbsoluteUrl("/"),
    siteName: "Sourcebee",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sourcebee - Precision Developer Tools",
    description:
      "A high-performance hive of developer tools designed for speed, reliability, and technical precision.",
  },
};

export default function HomePage() {
  const featuredTools = TOOLS.slice(0, 6);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-sm dark:border-white/10 dark:bg-[#111722]/90 sm:p-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-brand-400/14 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">Developer platform</p>
        <h1 className="font-display mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
          Sourcebee is a precision hive of developer tools built for real work.
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Fast execution, strict validation, and consistent interfaces across every tool. No clutter. No gimmicks. Just reliable
          utilities for engineering workflows.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/tools" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-400">
            Browse tools
          </Link>
          <Link
            href="/categories/security"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Open security tools
          </Link>
        </div>
      </section>

      <AdSlot label="Homepage top" />

      <section aria-labelledby="featured-tools" className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 id="featured-tools" className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Featured Tools
          </h2>
          <Link href="/tools" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} featured />
          ))}
        </div>
      </section>

      <section aria-labelledby="tool-categories" className="space-y-4">
        <h2 id="tool-categories" className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Categories
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map((category) => (
            <article
              key={category.slug}
              className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-[#111722]/90"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{category.name}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{category.description}</p>
              <Link href={`/categories/${category.slug}`} className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
                Explore {category.name.toLowerCase()}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
