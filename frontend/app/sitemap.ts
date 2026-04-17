import type { MetadataRoute } from "next";

import { CATEGORIES, TOOLS } from "@/lib/tool-registry";
import { toAbsoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: toAbsoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: toAbsoluteUrl("/tools"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...TOOLS.map((tool) => ({
      url: toAbsoluteUrl(`/tools/${tool.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...CATEGORIES.map((category) => ({
      url: toAbsoluteUrl(`/categories/${category.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
