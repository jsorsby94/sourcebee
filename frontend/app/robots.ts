import type { MetadataRoute } from "next";

import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const appEnv =
    process.env.NEXT_PUBLIC_APP_ENV ??
    process.env.APP_ENV ??
    process.env.NODE_ENV ??
    "development";
  const env = appEnv.toLowerCase();
  const isProduction = env === "prod" || env === "production";

  if (!isProduction) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: toAbsoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
