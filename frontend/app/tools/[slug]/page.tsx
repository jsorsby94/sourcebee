import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/tools/ad-slot";
import { RelatedTools } from "@/components/tools/related-tools";
import { ToolFaq } from "@/components/tools/tool-faq";
import { ToolRuntimePanel } from "@/components/tools/tool-runtime-panel";
import { getToolBySlug, TOOLS } from "@/lib/tool-registry";
import { buildFaqJsonLd, buildToolJsonLd, buildToolMetadata } from "@/lib/seo";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return { title: "Tool Not Found" };
  }

  return buildToolMetadata(tool);
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const faqSchema = buildFaqJsonLd(tool);
  const toolSchema = buildToolJsonLd(tool);

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">{tool.category}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{tool.name}</h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">{tool.intro}</p>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">{tool.explanation}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Browse more in <Link href="/tools" className="text-brand-700 hover:underline dark:text-brand-300">All Tools</Link>.
        </p>
      </header>

      <AdSlot label={`${tool.name} primary`} />

      <section aria-labelledby="tool-runtime-heading" className="space-y-3">
        <h2 id="tool-runtime-heading" className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
          Run {tool.name}
        </h2>
        <ToolRuntimePanel tool={tool} />
      </section>

      <AdSlot label={`${tool.name} secondary`} />

      <ToolFaq items={tool.faqs} />
      <RelatedTools related={tool.related} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
    </article>
  );
}
