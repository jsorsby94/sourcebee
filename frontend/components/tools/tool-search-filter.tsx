"use client";

import type { CategorySlug } from "@/lib/tool-registry";
import { CATEGORIES } from "@/lib/tool-registry";
import { cn } from "@/lib/utils";

interface ToolSearchFilterProps {
  query: string;
  activeCategory: CategorySlug | "all";
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: CategorySlug | "all") => void;
  showCategories?: boolean;
}

export function ToolSearchFilter({
  query,
  activeCategory,
  onQueryChange,
  onCategoryChange,
  showCategories = true,
}: ToolSearchFilterProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#111722]/90">
      <label htmlFor="tools-search" className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
        Search tools
      </label>
      <input
        id="tools-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search by name, category, or use case"
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-white/15 dark:bg-[#0d131e] dark:text-slate-100 dark:placeholder:text-slate-500"
      />

      {showCategories ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCategoryChange("all")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              activeCategory === "all"
                ? "border-brand-500/60 bg-brand-500 text-slate-950"
                : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
            )}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => onCategoryChange(category.slug)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                activeCategory === category.slug
                  ? "border-brand-500/60 bg-brand-500 text-slate-950"
                  : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
