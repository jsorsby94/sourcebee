import { cn } from "@/lib/utils";

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

interface AdSlotProps {
  label: string;
  className?: string;
}

export function AdSlot({ label, className }: AdSlotProps) {
  if (!ADS_ENABLED) {
    return null;
  }

  return (
    <aside
      className={cn(
        "flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400",
        className,
      )}
      aria-label={`${label} ad slot`}
    >
      {label} ad slot
    </aside>
  );
}
