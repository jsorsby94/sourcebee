import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white/80 py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:px-8 md:grid-cols-2">
        <div>
          <p className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">Simple Tools Hub</p>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Fast, practical web tools with security-first defaults, strong SEO foundations, and production-minded architecture.
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-sm text-slate-600 dark:text-slate-300">Explore</p>
          <div className="mt-2 flex flex-wrap gap-3 md:justify-end">
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
