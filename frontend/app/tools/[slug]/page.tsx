import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ToolShell } from "@/components/tools/tool-shell";
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
    <>
      <ToolShell tool={tool} runtime={<ToolRuntimePanel tool={tool} />} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
    </>
  );
}
