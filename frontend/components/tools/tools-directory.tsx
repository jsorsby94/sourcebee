"use client";

import { useMemo, useState } from "react";

import { ToolCard } from "@/components/tools/tool-card";
import { ToolSearchFilter } from "@/components/tools/tool-search-filter";
import { CATEGORIES, TOOLS, type CategorySlug } from "@/lib/tool-registry";

interface ToolsDirectoryProps {
  initialCategory?: CategorySlug | "all";
  showCategoryFilter?: boolean;
}

export function ToolsDirectory({ initialCategory = "all", showCategoryFilter = true }: ToolsDirectoryProps) {
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
        tool.category.toLowerCase().includes(normalizedQuery) ||
        tool.searchKeywords.some((keyword) => keyword.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [activeCategory, query]);

  const activeCategoryName =
    activeCategory === "all"
      ? "all categories"
      : (CATEGORIES.find((category) => category.slug === activeCategory)?.name ?? activeCategory);

  return (
    <section className="space-y-5">
      <ToolSearchFilter
        query={query}
        activeCategory={activeCategory}
        onQueryChange={setQuery}
        onCategoryChange={setActiveCategory}
        showCategories={showCategoryFilter}
      />

      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {filteredTools.length} tools • {activeCategoryName}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredTools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </section>
  );
}
