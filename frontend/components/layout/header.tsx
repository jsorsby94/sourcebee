import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tools" },
  { href: "/categories/security", label: "Security" },
  { href: "/categories/developer", label: "Developer" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/15 dark:bg-[#090d12]/95">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-slate-900 dark:text-slate-50">
          <BrandMark />
        </Link>

        <nav className="hidden gap-6 text-sm font-semibold text-slate-600 dark:text-slate-100 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1 transition hover:text-brand-700 dark:text-slate-100/90 dark:hover:bg-white/10 dark:hover:text-brand-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/tools"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 md:hidden dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Tools
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
