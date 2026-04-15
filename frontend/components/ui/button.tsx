import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70 disabled:cursor-not-allowed disabled:opacity-60";

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "border border-brand-500/45 bg-brand-500 text-slate-950 shadow-[0_10px_24px_-16px_rgba(245,158,11,0.9)] hover:bg-brand-400",
    secondary:
      "border border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10",
    ghost:
      "border border-transparent bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/5",
  };

  return <button className={cn(base, variantStyles[variant], className)} {...props} />;
}
