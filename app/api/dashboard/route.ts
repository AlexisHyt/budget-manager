import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import {
  bankAccounts,
  incomes,
  payments,
  subscriptions,
  user,
} from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";
import {
  generateMonthKey,
  getMonthsInRange,
  isRecurringInMonth,
} from "@/lib/budget/utils";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const searchParams = request.nextUrl.searchParams;
    const now = new Date();
    const year = Number.parseInt(
      searchParams.get("year") || String(now.getFullYear()),
      10,
    );
    const month = Number.parseInt(
      searchParams.get("month") || String(now.getMonth() + 1),
      10,
    );

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 1);

    const [
      userAccounts,
      userIncomes,
      userSubscriptions,
      userPayments,
      userData,
    ] = await Promise.all([
      db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, session.user.id)),
      db.select().from(incomes).where(eq(incomes.userId, session.user.id)),
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id)),
      db.select().from(payments).where(eq(payments.userId, session.user.id)),
      db.select().from(user).where(eq(user.id, session.user.id)),
    ]);

    const months = getMonthsInRange(startDate, endDate);

    const monthlyData: Record<
      string,
      {
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
      }
    > = {};

    months.forEach((m) => {
      const key = generateMonthKey(m);
      monthlyData[key] = {
        monthKey: key,
        month: m.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        }),
        monthDate: new Date(m.getFullYear(), m.getMonth(), 1).toISOString(),
        byAccount: {},
        total: {
          income: 0,
          subscriptions: 0,
          payments: 0,
          expenses: 0,
          remaining: 0,
        },
      };

      userAccounts.forEach((acc) => {
        monthlyData[key].byAccount[acc.id] = {
          income: 0,
          subscriptions: 0,
          payments: 0,
        };
      });
    });

    userIncomes.forEach((inc) => {
      months.forEach((m) => {
        if (
          isRecurringInMonth(
            new Date(inc.startDate),
            null,
            inc.frequency as "monthly" | "annual" | "one-time",
            m,
          )
        ) {
          const accountId = inc.bankAccountId || "unassigned";
          const key = generateMonthKey(m);

          if (!monthlyData[key].byAccount[accountId]) {
            monthlyData[key].byAccount[accountId] = {
              income: 0,
              subscriptions: 0,
              payments: 0,
            };
          }

          monthlyData[key].byAccount[accountId].income += inc.amount;
          monthlyData[key].total.income += inc.amount;
        }
      });
    });

    userSubscriptions.forEach((sub) => {
      if (!sub.active) return;

      months.forEach((m) => {
        if (
          isRecurringInMonth(
            new Date(sub.startDate),
            sub.endDate ? new Date(sub.endDate) : null,
            sub.frequency as
              | "monthly"
              | "every-two-months"
              | "bi-annual"
              | "annual",
            m,
          )
        ) {
          const key = generateMonthKey(m);
          if (!monthlyData[key].byAccount[sub.bankAccountId]) {
            monthlyData[key].byAccount[sub.bankAccountId] = {
              income: 0,
              subscriptions: 0,
              payments: 0,
            };
          }
          monthlyData[key].byAccount[sub.bankAccountId].subscriptions +=
            sub.amount;
          monthlyData[key].total.subscriptions += sub.amount;
        }
      });
    });

    userPayments.forEach((pay) => {
      months.forEach((m) => {
        const payMonth = new Date(pay.dueDate);
        if (
          payMonth.getFullYear() === m.getFullYear() &&
          payMonth.getMonth() === m.getMonth()
        ) {
          const key = generateMonthKey(m);
          if (!monthlyData[key].byAccount[pay.bankAccountId]) {
            monthlyData[key].byAccount[pay.bankAccountId] = {
              income: 0,
              subscriptions: 0,
              payments: 0,
            };
          }
          monthlyData[key].byAccount[pay.bankAccountId].payments += pay.amount;
          monthlyData[key].total.payments += pay.amount;
        }
      });
    });

    Object.values(monthlyData).forEach((entry) => {
      entry.total.expenses = entry.total.subscriptions + entry.total.payments;
      entry.total.remaining = entry.total.income - entry.total.expenses;
    });

    const selectedMonth = Math.min(Math.max(month, 1), 12);
    const selectedDate = new Date(year, selectedMonth - 1, 1);
    const currentMonthKey = generateMonthKey(selectedDate);
    const currentMonthData = monthlyData[currentMonthKey] || {
      monthKey: currentMonthKey,
      month: selectedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      }),
      monthDate: selectedDate.toISOString(),
      byAccount: {},
      total: {
        income: 0,
        subscriptions: 0,
        payments: 0,
        expenses: 0,
        remaining: 0,
      },
    };

    const accountBalances = userAccounts.map((acc) => {
      const accountData = currentMonthData.byAccount[acc.id] || {
        income: 0,
        subscriptions: 0,
        payments: 0,
      };
      return {
        id: acc.id,
        name: acc.name,
        color: acc.color,
        income: accountData.income,
        subscriptions: accountData.subscriptions,
        payments: accountData.payments,
        remaining:
          accountData.income - accountData.subscriptions - accountData.payments,
      };
    });

    const monthlyRows = Object.values(monthlyData).map((entry) => ({
      monthKey: entry.monthKey,
      month: entry.month,
      monthDate: entry.monthDate,
      income: entry.total.income,
      subscriptions: entry.total.subscriptions,
      payments: entry.total.payments,
      expenses: entry.total.expenses,
      remaining: entry.total.remaining,
      byAccount: entry.byAccount,
    }));

    // Build per-item detail rows for the spreadsheet view
    const accountMap = new Map(userAccounts.map((acc) => [acc.id, acc]));
    const monthKeys = months.map((m) => generateMonthKey(m));

    const detailRows: Array<{
      id: string;
      name: string;
      type: "subscription" | "payment";
      day: number;
      frequency: string;
      bankAccountId: string;
      bankAccountName: string;
      bankAccountColor: string;
      indicator: string | null;
      monthAmounts: Record<string, number | null>;
    }> = [];

    userSubscriptions.forEach((sub) => {
      if (!sub.active) return;
      const acc = accountMap.get(sub.bankAccountId);
      const monthAmounts: Record<string, number | null> = {};

      monthKeys.forEach((key, i) => {
        const m = months[i];
        const active = isRecurringInMonth(
          new Date(sub.startDate),
          sub.endDate ? new Date(sub.endDate) : null,
          sub.frequency as
            | "monthly"
            | "every-two-months"
            | "bi-annual"
            | "annual",
          m,
        );
        monthAmounts[key] = active ? sub.amount : null;
      });

      detailRows.push({
        id: sub.id,
        name: sub.name,
        type: "subscription",
        day: new Date(sub.startDate).getDate(),
        frequency: sub.frequency,
        bankAccountId: sub.bankAccountId,
        bankAccountName: acc?.name ?? "Unknown",
        bankAccountColor: acc?.color ?? "#888888",
        indicator: sub.indicator ?? null,
        monthAmounts,
      });
    });

    userPayments.forEach((pay) => {
      const acc = accountMap.get(pay.bankAccountId);
      const dueDate = new Date(pay.dueDate);
      const monthAmounts: Record<string, number | null> = {};

      monthKeys.forEach((key) => {
        const [yr, mo] = key.split("-").map(Number);
        const isMatch =
          dueDate.getFullYear() === yr && dueDate.getMonth() + 1 === mo;
        monthAmounts[key] = isMatch ? pay.amount : null;
      });

      detailRows.push({
        id: pay.id,
        name: pay.name,
        type: "payment",
        day: dueDate.getDate(),
        frequency: "one-time",
        bankAccountId: pay.bankAccountId,
        bankAccountName: acc?.name ?? "Unknown",
        bankAccountColor: acc?.color ?? "#888888",
        indicator: null,
        monthAmounts,
      });
    });

    return NextResponse.json({
      month: {
        year,
        month: selectedMonth,
      },
      monthlyData: monthlyRows,
      currentMonth: currentMonthData,
      accountBalances,
      detailRows,
      currency: userData[0]?.currency || "USD",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
