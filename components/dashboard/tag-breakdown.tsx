"use client";

import { useState } from "react";
import type {
  DetailRow,
  MonthCol,
} from "@/components/dashboard/detail-spreadsheet";
import {
  type MonthScope,
  MonthScopeToggle,
} from "@/components/dashboard/month-scope-toggle";
import type { TagLike } from "@/components/dashboard/tag-badge";
import { formatCurrency } from "@/lib/budget/utils";
import type { TCurrency } from "@/types/TCurrency";

interface TagBreakdownProps {
  rows: DetailRow[];
  monthCols: MonthCol[];
  currentMonthKey: string;
  currency?: TCurrency;
}

interface TagGroup {
  key: string;
  tag: TagLike | null;
  rows: DetailRow[];
}

const UNTAGGED_KEY = "__untagged__";

function sumRows(rows: DetailRow[], monthKey: string): number {
  return rows.reduce((sum, row) => sum + (row.monthAmounts[monthKey] ?? 0), 0);
}

function sumRowsOverCols(rows: DetailRow[], cols: MonthCol[]): number {
  return cols.reduce((sum, col) => sum + sumRows(rows, col.key), 0);
}

export function TagBreakdown({
  rows,
  monthCols,
  currentMonthKey,
  currency = "USD",
}: TagBreakdownProps) {
  const [byAllScope, setByAllScope] = useState<MonthScope>("current");

  const visibleCols =
    byAllScope === "all"
      ? monthCols
      : monthCols.filter((m) => m.key === currentMonthKey);

  // A Total column only makes sense once several months are on screen.
  const showTotalCol = byAllScope === "all";

  // Only subscriptions can carry tags — payments would all land in "Untagged".
  const subscriptionRows = rows.filter((row) => row.type === "subscription");

  const groups = new Map<string, TagGroup>();
  subscriptionRows.forEach((row) => {
    if (row.tags.length === 0) {
      const untagged = groups.get(UNTAGGED_KEY);
      if (untagged) {
        untagged.rows.push(row);
      } else {
        groups.set(UNTAGGED_KEY, { key: UNTAGGED_KEY, tag: null, rows: [row] });
      }
      return;
    }

    row.tags.forEach((tag) => {
      const existing = groups.get(tag.id);
      if (existing) {
        existing.rows.push(row);
      } else {
        groups.set(tag.id, { key: tag.id, tag, rows: [row] });
      }
    });
  });

  const sortedGroups = [...groups.values()].sort((a, b) => {
    if (!a.tag) return 1;
    if (!b.tag) return -1;
    return a.tag.name.localeCompare(b.tag.name);
  });

  const multiTagged = subscriptionRows.some((row) => row.tags.length > 1);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">By tag</h2>
          <p className="text-sm text-muted-foreground">
            Subscriptions only, grouped by tag
            {multiTagged
              ? " — a subscription with several tags is counted in each of them"
              : ""}
          </p>
        </div>
        <MonthScopeToggle value={byAllScope} onChange={setByAllScope} />
      </div>

      {subscriptionRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active subscription to break down.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            style={{ minWidth: visibleCols.length > 1 ? "860px" : "480px" }}
          >
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th
                  className="sticky left-0 z-10 bg-card px-3 py-2.5 font-semibold"
                  style={{ minWidth: "180px" }}
                >
                  Tag
                </th>
                {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-2.5 text-right font-semibold ${
                      col.key === currentMonthKey ? "text-primary" : ""
                    }`}
                    style={{ minWidth: "90px" }}
                  >
                    {col.label}
                  </th>
                ))}
                {showTotalCol && (
                  <th
                    className="px-3 py-2.5 text-right font-semibold"
                    style={{ minWidth: "100px" }}
                  >
                    Total
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group) => (
                <tr
                  key={group.key}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td
                    className="sticky left-0 z-10 bg-card px-3 py-2.5"
                    style={{ minWidth: "180px" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: group.tag?.color ?? "transparent",
                          boxShadow: group.tag
                            ? undefined
                            : "inset 0 0 0 1px var(--color-border)",
                        }}
                      />
                      <span
                        className={
                          group.tag
                            ? "font-medium leading-tight"
                            : "font-medium italic leading-tight text-muted-foreground"
                        }
                      >
                        {group.tag?.name ?? "Untagged"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({group.rows.length})
                      </span>
                    </div>
                  </td>
                  {visibleCols.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2.5 text-right ${
                        col.key === currentMonthKey ? "font-medium" : ""
                      }`}
                      style={{ minWidth: "90px" }}
                    >
                      {formatCurrency(sumRows(group.rows, col.key), currency)}
                    </td>
                  ))}
                  {showTotalCol && (
                    <td
                      className="px-3 py-2.5 text-right font-medium"
                      style={{ minWidth: "100px" }}
                    >
                      {formatCurrency(
                        sumRowsOverCols(group.rows, visibleCols),
                        currency,
                      )}
                    </td>
                  )}
                </tr>
              ))}

              <tr className="border-t-2 border-border">
                <td
                  className="sticky left-0 z-10 bg-card px-3 py-2.5 font-semibold"
                  style={{ minWidth: "180px" }}
                >
                  Total
                </td>
                {visibleCols.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 text-right font-semibold ${
                      col.key === currentMonthKey ? "text-primary" : ""
                    }`}
                    style={{ minWidth: "90px" }}
                  >
                    {formatCurrency(
                      sumRows(subscriptionRows, col.key),
                      currency,
                    )}
                  </td>
                ))}
                {showTotalCol && (
                  <td
                    className="px-3 py-2.5 text-right font-semibold"
                    style={{ minWidth: "100px" }}
                  >
                    {formatCurrency(
                      sumRowsOverCols(subscriptionRows, visibleCols),
                      currency,
                    )}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
