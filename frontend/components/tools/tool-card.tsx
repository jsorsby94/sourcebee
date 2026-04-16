import Link from "next/link";

import type { ToolDefinition } from "@/lib/tool-registry";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  tool: ToolDefinition;
  featured?: boolean;
  compact?: boolean;
  className?: string;
}

function iconGlyph(iconKey: ToolDefinition["iconKey"]): string {
  switch (iconKey) {
    case "token":
      return "JW";
    case "base64":
      return "64";
    case "yaml":
      return "YML";
    case "hash":
      return "SHA";
    case "uuid":
      return "UID";
    case "url":
      return "URL";
    case "time":
      return "UTC";
    case "cron":
      return "CRN";
    case "json":
      return "{}";
    case "units":
      return "CM";
    case "math":
      return "FX";
    case "ssl":
      return "TLS";
    case "qr":
      return "QR";
    case "image":
      return "IMG";
    case "pdf":
      return "PDF";
    case "password":
      return "PW";
    case "color":
      return "RGB";
    default:
      return "SB";
  }
}

export function ToolCard({ tool, featured = false, compact = false, className }: ToolCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-glow dark:border-white/10 dark:bg-[#111722]/95 dark:hover:border-brand-500/55",
        featured ? "p-5" : "",
        className,
      )}
    >
      <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-brand-300/12 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <p className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/15 dark:text-slate-300">
          {tool.category}
        </p>
        <span
          aria-hidden
          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-brand-500/35 bg-brand-500/15 px-2 font-mono text-[11px] font-semibold text-brand-700 dark:text-brand-300"
        >
          {iconGlyph(tool.iconKey)}
        </span>
      </div>

      <h3
        className={cn(
          "mt-3 font-display font-semibold tracking-tight text-slate-900 dark:text-slate-100",
          featured ? "text-xl" : "text-lg",
        )}
      >
        <Link href={`/tools/${tool.slug}`} className="outline-none focus-visible:rounded">
          {tool.name}
        </Link>
      </h3>
      <p className={cn("mt-2 text-sm text-slate-600 dark:text-slate-300", compact ? "min-h-10" : "")}>
        {tool.shortDescription}
      </p>

      <Link
        href={`/tools/${tool.slug}`}
        className="mt-4 inline-flex items-center text-sm font-semibold text-brand-700 transition group-hover:text-brand-600 hover:underline dark:text-brand-300 dark:group-hover:text-brand-200"
      >
        Open tool
      </Link>
    </article>
  );
}
