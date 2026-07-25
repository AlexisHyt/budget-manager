"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
      <Button
        type="button"
        size="sm"
        variant={theme === "dark" ? "secondary" : "ghost"}
        className={cn("min-w-20", theme === "dark" ? "shadow-sm" : undefined)}
        onClick={() => setTheme("dark")}
      >
        Dark
      </Button>
      <Button
        type="button"
        size="sm"
        variant={theme === "light" ? "secondary" : "ghost"}
        className={cn("min-w-20", theme === "light" ? "shadow-sm" : undefined)}
        onClick={() => setTheme("light")}
      >
        Light
      </Button>
    </div>
  );
}
