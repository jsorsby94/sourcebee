export const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false";

export const VISITOR_COOKIE_NAME = process.env.NEXT_PUBLIC_VISITOR_COOKIE_NAME ?? "sthub_vid";

const cookieMaxAgeRaw = Number(process.env.NEXT_PUBLIC_VISITOR_COOKIE_MAX_AGE_SECONDS ?? "31536000");

export const VISITOR_COOKIE_MAX_AGE_SECONDS = Number.isFinite(cookieMaxAgeRaw) && cookieMaxAgeRaw > 0
  ? Math.floor(cookieMaxAgeRaw)
  : 31_536_000;
