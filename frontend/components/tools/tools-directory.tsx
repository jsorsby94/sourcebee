"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { CATEGORIES, TOOLS, type CategorySlug } from "@/lib/tool-registry";

interface ToolsDirectoryProps {
  initialCategory?: CategorySlug | "all";
}

export function ToolsDirectory({ initialCategory = "all" }: ToolsDirectoryProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategorySlug | "all">(initialCategory);

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return TOOLS.filter((tool) => {
      if (activeCategory !== "all" && tool.category !== activeCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        tool.name.toLowerCase().includes(normalizedQuery) ||
        tool.shortDescription.toLowerCase().includes(normalizedQuery) ||
        tool.category.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeCategory, query]);

  return (
    <section className="space-y-5">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label htmlFor="tools-search" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Search tools
        </label>
        <input
          id="tools-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, category, or use case"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              activeCategory === "all"
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setActiveCategory(category.slug)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategory === category.slug
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Card key={tool.slug} className="group">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">{tool.category}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900 transition group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
              <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tool.shortDescription}</p>
            <Link href={`/tools/${tool.slug}`} className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
              Open tool
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
