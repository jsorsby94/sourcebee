import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">Page not found</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">The page you requested does not exist or may have moved.</p>
      <Link href="/tools" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
        Return to tools index
      </Link>
    </div>
  );
}
