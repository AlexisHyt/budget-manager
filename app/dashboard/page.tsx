"use client";

import { Fragment, useEffect, useState } from "react";
import { DetailBanksSpreadsheet } from "@/components/dashboard/detail-banks-spreadsheet";
import {
  type DetailRow,
  DetailSpreadsheet,
} from "@/components/dashboard/detail-spreadsheet";
import { TagBreakdown } from "@/components/dashboard/tag-breakdown";
import { formatCurrency, generateMonthKey } from "@/lib/budget/utils";
import { cn } from "@/lib/utils";
import type { TCurrency } from "@/types/TCurrency";

export interface DashboardData {
  month: { year: number; month: number };
  monthlyData: Array<{
    monthKey: string;
    month: string;
    monthDate: string;
    income: number;
    subscriptions: number;
    payments: number;
    expenses: number;
    remaining: number;
    byAccount: Record<
      string,
      { income: number; subscriptions: number; payments: number }
    >;
  }>;
  currentMonth: {
    monthKey: string;
    month: string;
    monthDate: string;
    byAccount: Record<
      string,
      { income: number; subscriptions: number; payments: number }
    >;
    total: {
      income: number;
      subscriptions: number;
      payments: number;
      expenses: number;
      remaining: number;
    };
  };
  accountBalances: Array<{
    id: string;
    name: string;
    color: string;
    income: number;
    subscriptions: number;
    payments: number;
    remaining: number;
  }>;
  detailRows: DetailRow[];
  currency: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading)
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
        Error: {error}
      </div>
    );
  }

  if (!data) return <div>No data available</div>;

  const {
    income: totalIncome,
    subscriptions: totalSubscriptions,
    payments: totalPayments,
    expenses: totalExpenses,
    remaining: totalRemaining,
  } = data.currentMonth.total;
  const currentMonthKey = generateMonthKey(
    new Date(data.month.year, data.month.month - 1, 1),
  );
  const monthCols = data.monthlyData.map((row) => ({
    key: row.monthKey,
    label: row.month,
  }));
  const currency = (data.currency || "USD") as TCurrency;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">
          Summary
          <CurrentMonth />
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">
              Total Income
            </div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {formatCurrency(totalIncome, currency)}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">
              Subscriptions
            </div>
            <div className="mt-2 text-3xl font-bold text-orange-600">
              {formatCurrency(totalSubscriptions, currency)}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">
              Payments
            </div>
            <div className="mt-2 text-3xl font-bold text-red-600">
              {formatCurrency(totalPayments, currency)}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">
              Remaining
            </div>
            <div
              className={`mt-2 text-3xl font-bold ${
                totalRemaining >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(totalRemaining, currency)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <DetailBanksSpreadsheet
          data={data}
          currentMonthKey={currentMonthKey}
          currency={currency}
        />
      </div>

      <div className="space-y-4">
        <DetailSpreadsheet
          rows={data.detailRows}
          monthCols={monthCols}
          currentMonthKey={currentMonthKey}
          currency={currency}
        />
      </div>

      <div className="space-y-4">
        <TagBreakdown
          rows={data.detailRows}
          monthCols={monthCols}
          currentMonthKey={currentMonthKey}
          currency={currency}
        />
      </div>
    </div>
  );
}

function CurrentMonth() {
  return (
    <span className="text-muted-foreground italic text-xs ml-1">
      (current month)
    </span>
  );
}
