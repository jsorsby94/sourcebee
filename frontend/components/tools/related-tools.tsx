import Link from "next/link";

import { ToolCard } from "@/components/tools/tool-card";
import { getToolBySlug, type ToolSlug } from "@/lib/tool-registry";

interface RelatedToolsProps {
  related: ToolSlug[];
}

export function RelatedTools({ related }: RelatedToolsProps) {
  const tools = related
    .map((slug) => getToolBySlug(slug))
    .filter((tool): tool is NonNullable<ReturnType<typeof getToolBySlug>> => Boolean(tool));

  if (tools.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-tools-heading" className="space-y-4">
      <h2 id="related-tools-heading" className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
        Related Tools
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} compact />
        ))}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Need a broader list? Browse the{" "}
        <Link href="/tools" className="text-brand-700 hover:underline dark:text-brand-300">
          full tools directory
        </Link>
        .
      </p>
    </section>
  );
}
