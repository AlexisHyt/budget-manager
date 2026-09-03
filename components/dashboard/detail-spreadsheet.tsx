"use client";

import { Fragment, useState } from "react";
import {
  type MonthScope,
  MonthScopeToggle,
} from "@/components/dashboard/month-scope-toggle";
import { TagDots, type TagLike } from "@/components/dashboard/tag-badge";
import { formatCurrency } from "@/lib/budget/utils";
import type { TCurrency } from "@/types/TCurrency";

export interface DetailRow {
  id: string;
  name: string;
  type: "subscription" | "payment";
  day: number;
  frequency: string;
  bankAccountId: string;
  bankAccountName: string;
  bankAccountColor: string;
  indicator: string | null;
  tags: TagLike[];
  monthAmounts: Record<string, number | null>;
}

const indicatorColors: Record<string, string> = {
  important: "#3b82f6", // blue
  ok: "#22c55e", // green
  fine: "#f59e0b", // amber
  "to-remove": "#ef4444", // red
};

export interface MonthCol {
  key: string;
  label: string;
}

interface DetailSpreadsheetProps {
  rows: DetailRow[];
  monthCols: MonthCol[];
  currentMonthKey: string;
  currency?: TCurrency;
}

export function DetailSpreadsheet({
  rows,
  monthCols,
  currentMonthKey,
  currency = "USD",
}: DetailSpreadsheetProps) {
  const [byAllScope, setByAllScope] = useState<MonthScope>("current");

  const visibleCols =
    byAllScope === "all"
      ? monthCols
      : monthCols.filter((m) => m.key === currentMonthKey);

  // Group rows by billing day
  const dayGroups = new Map<number, DetailRow[]>();
  rows.forEach((row) => {
    if (!dayGroups.has(row.day)) dayGroups.set(row.day, []);
    dayGroups.get(row.day)!.push(row);
  });
  const sortedDays = [...dayGroups.keys()].sort((a, b) => a - b);

  // Column totals (sum of all active amounts per month)
  const colTotals: Record<string, number> = {};
  visibleCols.forEach((col) => {
    colTotals[col.key] = rows.reduce(
      (sum, row) => sum + (row.monthAmounts[col.key] ?? 0),
      0,
    );
  });

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Detailed breakdown</h2>
          <p className="text-sm text-muted-foreground">
            All subscriptions and payments, grouped by billing day
          </p>
        </div>
        <MonthScopeToggle value={byAllScope} onChange={setByAllScope} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No subscriptions or payments yet. Add some to see your breakdown here.
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
                  Item
                </th>
                <th
                  className="sticky left-[180px] z-10 bg-card px-3 py-2.5 font-semibold"
                  style={{ minWidth: "130px" }}
                >
                  Account
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
              </tr>
            </thead>
            <tbody>
              {sortedDays.map((day) => (
                <Fragment key={`day-${day}`}>
                  {/* Day separator */}
                  <tr>
                    <td className="sticky left-0 z-10 bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Day {day}
                    </td>
                    <td className="sticky left-[180px] z-10 bg-muted" />
                    {visibleCols.map((_, index) => (
                      <td
                        key={index}
                        className="sticky left-[180px] z-10 bg-muted"
                      />
                    ))}
                  </tr>

                  {/* Items for this day */}
                  {dayGroups.get(day)!.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/40 transition-colors hover:bg-muted/20"
                    >
                      {/* Name — sticky */}
                      <td
                        className="sticky left-0 z-10 bg-card px-3 py-2.5"
                        style={{ minWidth: "180px" }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">
                            {row.type === "subscription" ? "🔄" : "💳"}
                          </span>
                          {row.indicator && (
                            <span
                              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                              style={{
                                backgroundColor: indicatorColors[row.indicator],
                              }}
                              title={row.indicator}
                            />
                          )}
                          <span className="font-medium leading-tight">
                            {row.name}
                          </span>
                          <TagDots tags={row.tags} />
                        </div>
                      </td>

                      {/* Account */}
                      <td
                        className="sticky left-[180px] z-10 bg-card px-3 py-2.5"
                        style={{ minWidth: "130px" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: row.bankAccountColor }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {row.bankAccountName}
                          </span>
                        </div>
                      </td>

                      {/* Month amounts */}
                      {visibleCols.map((col) => {
                        const amount = row.monthAmounts[col.key];
                        return (
                          <td
                            key={col.key}
                            className={`px-3 py-2.5 text-right ${
                              col.key === currentMonthKey ? "font-medium" : ""
                            }`}
                            style={{ minWidth: "90px" }}
                          >
                            {amount != null ? (
                              formatCurrency(
                                amount,
                                currency as
                                  | "USD"
                                  | "EUR"
                                  | "JPY"
                                  | "GBP"
                                  | "CHF"
                                  | "CAD"
                                  | "AUD",
                              )
                            ) : (
                              <span className="text-muted-foreground/30">
                                –
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}

              {/* Totals footer */}
              <tr className="border-t-2 border-border">
                <td
                  className="sticky left-0 z-10 bg-card px-3 py-2.5 font-semibold"
                  style={{ minWidth: "180px" }}
                >
                  Total
                </td>
                <td className="px-3 py-2.5" style={{ minWidth: "130px" }} />
                {visibleCols.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 text-right font-semibold ${
                      col.key === currentMonthKey ? "text-primary" : ""
                    }`}
                    style={{ minWidth: "90px" }}
                  >
                    {formatCurrency(
                      colTotals[col.key],
                      currency as
                        | "USD"
                        | "EUR"
                        | "JPY"
                        | "GBP"
                        | "CHF"
                        | "CAD"
                        | "AUD",
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
