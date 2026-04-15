import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/tools/ad-slot";
import { ToolsDirectory } from "@/components/tools/tools-directory";
import { CATEGORIES, getCategoryBySlug } from "@/lib/tool-registry";
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-[#111722]/90">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{category.name} Tools</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{category.description}</p>
      </section>

      <AdSlot label={`${category.name} category`} />

      <ToolsDirectory initialCategory={category.slug} showCategoryFilter={false} />

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Need broader coverage? Explore the{" "}
        <Link href="/tools" className="text-brand-700 hover:underline dark:text-brand-300">
          full tools index
        </Link>
        .
      </p>
    </div>
  );
}
