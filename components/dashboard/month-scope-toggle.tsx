"use client";

import { cn } from "@/lib/utils";

export type MonthScope = "current" | "all";

interface MonthScopeToggleProps {
  value: MonthScope;
  onChange: (scope: MonthScope) => void;
}

export function MonthScopeToggle({ value, onChange }: MonthScopeToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      <button
        type="button"
        onClick={() => onChange("current")}
        className={cn(
          "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
          value === "current"
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60",
        )}
      >
        Current month
      </button>
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
          value === "all"
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60",
        )}
      >
        All months
      </button>
    </div>
  );
}
