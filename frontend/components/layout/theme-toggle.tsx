"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost">Theme</Button>;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
      className="h-10 min-w-[92px] border border-slate-300 text-xs dark:border-white/15"
    >
      {isDark ? "Light Mode" : "Dark Mode"}
    </Button>
  );
}
