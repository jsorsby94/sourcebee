import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

const exploreLinks = [
  { href: "/tools", label: "All tools" },
  { href: "/categories/security", label: "Security" },
  { href: "/categories/utilities", label: "Utilities" },
  { href: "/privacy", label: "Privacy" },
];

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.48 0 12.24c0 5.4 3.44 9.98 8.2 11.59.6.11.82-.27.82-.59 0-.29-.01-1.07-.02-2.1-3.34.74-4.04-1.64-4.04-1.64-.55-1.42-1.33-1.8-1.33-1.8-1.09-.76.08-.74.08-.74 1.2.09 1.84 1.26 1.84 1.26 1.07 1.87 2.8 1.33 3.49 1.02.11-.79.42-1.33.76-1.63-2.67-.31-5.47-1.36-5.47-6.04 0-1.33.46-2.41 1.22-3.26-.12-.31-.53-1.56.11-3.25 0 0 1-.33 3.3 1.25a11.2 11.2 0 0 1 6 0c2.29-1.58 3.29-1.25 3.29-1.25.65 1.69.24 2.94.12 3.25.76.85 1.22 1.94 1.22 3.26 0 4.69-2.8 5.73-5.48 6.03.43.38.81 1.11.81 2.24 0 1.61-.01 2.92-.01 3.32 0 .33.22.71.82.59A12.24 12.24 0 0 0 24 12.24C24 5.48 18.63 0 12 0Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-[#0b0f14]/85">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <p className="text-slate-900 dark:text-slate-100">
              <BrandMark compact />
            </p>
            <p className="max-w-xl text-xs text-slate-600 dark:text-slate-300">
              Fast, precise developer utilities built for real engineering workflows.
            </p>
          </div>
          <nav
            aria-label="Footer links"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium sm:text-sm md:justify-end"
          >
            {exploreLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link
              href="https://github.com/jsorsby94"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              <GitHubIcon className="h-4 w-4" />
              <span>GitHub</span>
            </Link>
          </nav>
        </div>
        <p className="mt-4 border-t border-slate-200/70 pt-3 text-[11px] leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
          Privacy: tool inputs, uploaded files, and generated secrets are never retained. Behavioral metadata is collected for
          operational analytics.
        </p>
      </div>
    </footer>
  );
}
