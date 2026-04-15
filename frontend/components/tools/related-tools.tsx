import Link from "next/link";

import { Card } from "@/components/ui/card";
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
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.slug}>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">{tool.category}</p>
            <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{tool.name}</h3>
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
