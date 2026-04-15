interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className={`relative inline-flex items-center justify-center rounded-lg border border-brand-500/45 bg-brand-500/15 ${
          compact ? "h-7 w-7" : "h-8 w-8"
        }`}
      >
        <span className="absolute h-3.5 w-3.5 rotate-45 rounded-[3px] border border-brand-400/80" />
        <span className="absolute h-1.5 w-1.5 rounded-full bg-brand-400/90" />
      </span>
      <span className={`font-display font-semibold tracking-tight ${compact ? "text-base" : "text-lg"}`}>Sourcebee</span>
    </span>
  );
}
