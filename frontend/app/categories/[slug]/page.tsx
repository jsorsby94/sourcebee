import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/tools/ad-slot";
import { Card } from "@/components/ui/card";
import { CATEGORIES, getCategoryBySlug, getToolsByCategory } from "@/lib/tool-registry";
import { buildCategoryMetadata } from "@/lib/seo";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  return buildCategoryMetadata(category);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const tools = getToolsByCategory(category.slug);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{category.name} Tools</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{category.description}</p>
      </section>

      <AdSlot label={`${category.name} category`} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.slug}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{tool.name}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tool.shortDescription}</p>
            <Link href={`/tools/${tool.slug}`} className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
              Open tool
            </Link>
          </Card>
        ))}
      </section>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Need broader coverage? Explore the <Link href="/tools" className="text-brand-700 hover:underline dark:text-brand-300">full tools index</Link>.
      </p>
    </div>
  );
}
