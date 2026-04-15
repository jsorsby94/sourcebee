import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "All Tools" },
  { href: "/categories/security", label: "Security" },
  { href: "/categories/developer", label: "Developer" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Simple Tools Hub
        </Link>

        <nav className="hidden gap-6 text-sm text-slate-600 dark:text-slate-300 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-brand-700 dark:hover:text-brand-300">
              {item.label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
