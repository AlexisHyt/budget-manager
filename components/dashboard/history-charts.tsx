"use client";

import Chart from "chart.js/auto";
import { useEffect, useRef } from "react";

type MonthlyRow = {
  month: string;
  income: number;
  subscriptions: number;
  payments: number;
  expenses: number;
  remaining: number;
  byAccount: Record<
    string,
    { income: number; subscriptions: number; payments: number }
  >;
};

type Account = {
  id: string;
  name: string;
  color: string;
};

interface HistoryChartsProps {
  rows: MonthlyRow[];
  accounts: Account[];
}

export function HistoryCharts({ rows, accounts }: HistoryChartsProps) {
  const stackedCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (rows.length === 0) return;

    const labels = rows.map((row) => row.month);
    const stackedCanvas = stackedCanvasRef.current;

    if (!stackedCanvas) return;

    const stackedChart = new Chart(stackedCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: accounts.map((account) => ({
          label: account.name,
          data: rows.map((row) => {
            const accountRow = row.byAccount[account.id];
            return accountRow
              ? (accountRow.subscriptions + accountRow.payments) / 100
              : 0;
          }),
          backgroundColor: account.color,
          borderColor: account.color,
          borderWidth: 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
          },
        },
      },
    });

    return () => {
      stackedChart.destroy();
    };
  }, [rows, accounts]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        No monthly data available yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">
          Monthly Expenses by Account
        </h3>
        <div className="h-[520px]">
          <canvas ref={stackedCanvasRef} />
        </div>
      </div>
    </div>
  );
}
