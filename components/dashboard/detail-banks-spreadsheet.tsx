"use client";

import { Fragment, useState } from "react";
import type { DashboardData } from "@/app/dashboard/page";
import { formatCurrency } from "@/lib/budget/utils";
import { cn } from "@/lib/utils";
import type { TCurrency } from "@/types/TCurrency";

interface Props {
  data: DashboardData | null;
  currentMonthKey: string;
  currency?: TCurrency;
}
export function DetailBanksSpreadsheet({
  data,
  currentMonthKey,
  currency,
}: Props) {
  const [byAccountScope, setByAccountScope] = useState<"current" | "all">(
    "current",
  );

  if (!data) return null;

  const currentByAccountRows = data.accountBalances.map((account) => {
    const totals = data.currentMonth.byAccount[account.id] ?? {
      income: 0,
      subscriptions: 0,
      payments: 0,
    };
    const remaining = totals.income - totals.subscriptions - totals.payments;
    return {
      id: account.id,
      name: account.name,
      color: account.color,
      income: totals.income,
      subscriptions: totals.subscriptions,
      payments: totals.payments,
      remaining,
    };
  });

  const currentByAccountTotals = currentByAccountRows.reduce(
    (acc, row) => ({
      income: acc.income + row.income,
      subscriptions: acc.subscriptions + row.subscriptions,
      payments: acc.payments + row.payments,
      remaining: acc.remaining + row.remaining,
    }),
    { income: 0, subscriptions: 0, payments: 0, remaining: 0 },
  );

  const allByAccountMonthRows = data.monthlyData.flatMap((monthRow) =>
    data.accountBalances.map((account) => {
      const totals = monthRow.byAccount[account.id] ?? {
        income: 0,
        subscriptions: 0,
        payments: 0,
      };
      const remaining = totals.income - totals.subscriptions - totals.payments;
      return {
        id: `${monthRow.monthKey}-${account.id}`,
        month: monthRow.month,
        monthKey: monthRow.monthKey,
        accountName: account.name,
        accountColor: account.color,
        income: totals.income,
        subscriptions: totals.subscriptions,
        payments: totals.payments,
        remaining,
      };
    }),
  );

  const allByAccountMonthTotals = allByAccountMonthRows.reduce(
    (acc, row) => ({
      income: acc.income + row.income,
      subscriptions: acc.subscriptions + row.subscriptions,
      payments: acc.payments + row.payments,
      remaining: acc.remaining + row.remaining,
    }),
    { income: 0, subscriptions: 0, payments: 0, remaining: 0 },
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Detailed accounts breakdown</h2>
          <p className="text-sm text-muted-foreground">
            Display either the current month or all months for each account
          </p>
        </div>

        <div className="inline-flex rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => setByAccountScope("current")}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              byAccountScope === "current"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            Current month
          </button>
          <button
            type="button"
            onClick={() => setByAccountScope("all")}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              byAccountScope === "all"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            All months
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data.accountBalances.length === 0 ? (
          <p className="text-muted-foreground">
            No bank accounts yet. Create one to get started!
          </p>
        ) : (
          <div className="overflow-x-auto">
            {byAccountScope === "current" ? (
              <table className="w-full text-sm" style={{ minWidth: "700px" }}>
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2.5 font-semibold">Account</th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Income
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Subscriptions
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Payments
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Remaining
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentByAccountRows.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b border-border/40 transition-colors hover:bg-muted/20"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: account.color }}
                          />
                          <span className="font-medium">{account.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-green-600">
                        {formatCurrency(account.income, currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-orange-600">
                        {formatCurrency(account.subscriptions, currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-red-600">
                        {formatCurrency(account.payments, currency)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right font-semibold",
                          account.remaining >= 0
                            ? "text-green-600"
                            : "text-red-600",
                        )}
                      >
                        {formatCurrency(account.remaining, currency)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border">
                    <td className="px-3 py-2.5 font-semibold">Total</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-green-600">
                      {formatCurrency(currentByAccountTotals.income, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-orange-600">
                      {formatCurrency(
                        currentByAccountTotals.subscriptions,
                        currency,
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-red-600">
                      {formatCurrency(
                        currentByAccountTotals.payments,
                        currency,
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right font-semibold",
                        currentByAccountTotals.remaining >= 0
                          ? "text-green-600"
                          : "text-red-600",
                      )}
                    >
                      {formatCurrency(
                        currentByAccountTotals.remaining,
                        currency,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm" style={{ minWidth: "780px" }}>
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2.5 font-semibold">Month</th>
                    <th className="px-3 py-2.5 font-semibold">Account</th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Income
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Subscriptions
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Payments
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Remaining
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyData.map((monthRow, monthIndex) => (
                    <Fragment key={monthRow.monthKey}>
                      {monthIndex > 0 ? (
                        <tr key={`${monthRow.monthKey}-separator`}>
                          <td colSpan={6} className="h-2 bg-muted/30 p-0" />
                        </tr>
                      ) : null}
                      {data.accountBalances.map((account, accountIndex) => {
                        const totals = monthRow.byAccount[account.id] ?? {
                          income: 0,
                          subscriptions: 0,
                          payments: 0,
                        };
                        const remaining =
                          totals.income -
                          totals.subscriptions -
                          totals.payments;
                        return (
                          <tr
                            key={`${monthRow.monthKey}-${account.id}`}
                            className="border-b border-border/40 transition-colors hover:bg-muted/20"
                          >
                            {accountIndex === 0 ? (
                              <td
                                rowSpan={data.accountBalances.length}
                                className={cn(
                                  "px-3 py-2.5 align-top",
                                  monthRow.monthKey === currentMonthKey
                                    ? "font-medium text-primary"
                                    : "",
                                )}
                              >
                                {monthRow.month}
                              </td>
                            ) : null}
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: account.color }}
                                />
                                <span className="font-medium">
                                  {account.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right text-green-600">
                              {formatCurrency(totals.income, currency)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-orange-600">
                              {formatCurrency(totals.subscriptions, currency)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-red-600">
                              {formatCurrency(totals.payments, currency)}
                            </td>
                            <td
                              className={cn(
                                "px-3 py-2.5 text-right font-semibold",
                                remaining >= 0
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {formatCurrency(remaining, currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                  <tr className="border-t-2 border-border">
                    <td className="px-3 py-2.5 font-semibold" colSpan={2}>
                      Total
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-green-600">
                      {formatCurrency(allByAccountMonthTotals.income, currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-orange-600">
                      {formatCurrency(
                        allByAccountMonthTotals.subscriptions,
                        currency,
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-red-600">
                      {formatCurrency(
                        allByAccountMonthTotals.payments,
                        currency,
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right font-semibold",
                        allByAccountMonthTotals.remaining >= 0
                          ? "text-green-600"
                          : "text-red-600",
                      )}
                    >
                      {formatCurrency(
                        allByAccountMonthTotals.remaining,
                        currency,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
