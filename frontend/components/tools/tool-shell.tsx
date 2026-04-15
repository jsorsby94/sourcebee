import type { ReactNode } from "react";
import Link from "next/link";

import { AdSlot } from "@/components/tools/ad-slot";
import { RelatedTools } from "@/components/tools/related-tools";
import { ToolFaq } from "@/components/tools/tool-faq";
import type { ToolDefinition } from "@/lib/tool-registry";

interface ToolShellProps {
  tool: ToolDefinition;
  runtime: ReactNode;
}

export function ToolShell({ tool, runtime }: ToolShellProps) {
  return (
    <article className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-[#111722]/90 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-white/20 dark:text-slate-300">
            {tool.category}
          </p>
          <Link href="/tools" className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700 hover:underline dark:text-brand-300">
            All tools
          </Link>
        </div>
        <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{tool.intro}</p>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{tool.explanation}</p>
      </header>

      <AdSlot label={`${tool.name} primary`} />

      <section aria-labelledby="tool-runtime-heading" className="space-y-3">
        <h2 id="tool-runtime-heading" className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
          Run {tool.name}
        </h2>
        {runtime}
      </section>

      <AdSlot label={`${tool.name} secondary`} />

      <ToolFaq items={tool.faqs} />
      <RelatedTools related={tool.related} />
    </article>
  );
}
