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
        "flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100/80 px-4 text-center text-xs uppercase tracking-[0.14em] text-slate-500 dark:border-white/15 dark:bg-[#111722]/80 dark:text-slate-400",
        className,
      )}
      aria-label={`${label} ad slot`}
    >
      {label} ad slot
    </aside>
  );
}
