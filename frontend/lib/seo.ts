import type { Metadata } from "next";

import type { CategoryDefinition, ToolDefinition } from "@/lib/tool-registry";

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return envUrl && envUrl.length > 0 ? envUrl : "http://localhost:4000";
}

export function toAbsoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}

export function buildToolMetadata(tool: ToolDefinition): Metadata {
  const canonical = toAbsoluteUrl(`/tools/${tool.slug}`);

  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: canonical,
      siteName: "Sourcebee",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tool.seoTitle,
      description: tool.seoDescription,
    },
  };
}

export function buildCategoryMetadata(category: CategoryDefinition): Metadata {
  const title = `${category.name} Tools`;
  const description = `${category.description} Explore practical ${category.name.toLowerCase()} developer utilities on Sourcebee.`;
  const canonical = toAbsoluteUrl(`/categories/${category.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Sourcebee",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function buildFaqJsonLd(tool: ToolDefinition): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildToolJsonLd(tool: ToolDefinition): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    description: tool.shortDescription,
    url: toAbsoluteUrl(`/tools/${tool.slug}`),
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: "Sourcebee",
    },
  };
}
