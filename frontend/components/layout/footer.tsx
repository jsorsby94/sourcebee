import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white/70 py-10 dark:border-white/10 dark:bg-[#0b0f14]/75">
      <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 sm:px-6 lg:px-8 md:grid-cols-2">
        <div>
          <p className="text-slate-900 dark:text-slate-100">
            <BrandMark compact />
          </p>
          <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Fast, precise developer utilities built for real engineering workflows.
          </p>
          <p className="mt-2 max-w-md text-xs text-slate-500 dark:text-slate-400">
            Privacy: tool inputs, uploaded files, and generated secrets are never retained. Behavioral metadata is collected for
            operational analytics.
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Explore</p>
          <div className="mt-3 flex flex-wrap gap-3 md:justify-end">
            <Link href="/tools" className="text-sm text-brand-700 hover:underline dark:text-brand-300">
              All tools
            </Link>
            <Link href="/categories/security" className="text-sm text-brand-700 hover:underline dark:text-brand-300">
              Security tools
            </Link>
            <Link href="/categories/utilities" className="text-sm text-brand-700 hover:underline dark:text-brand-300">
              Utility tools
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
