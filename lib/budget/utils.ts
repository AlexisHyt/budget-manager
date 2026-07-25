/**
 * Budget utility functions for calculations and date handling
 */

export type IncomeFrequency = "monthly" | "annual" | "one-time";
export type SubscriptionFrequency =
  | "monthly"
  | "every-two-months"
  | "bi-annual"
  | "annual";
export type RecurringFrequency = IncomeFrequency | SubscriptionFrequency;

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "JPY"
  | "GBP"
  | "CHF"
  | "CAD"
  | "AUD";

const CURRENCY_CONFIG: Record<
  CurrencyCode,
  {
    locale: string;
    symbol: string;
    decimals: number;
  }
> = {
  USD: { locale: "en-US", symbol: "$", decimals: 2 },
  EUR: { locale: "de-DE", symbol: "€", decimals: 2 },
  JPY: { locale: "ja-JP", symbol: "¥", decimals: 0 },
  GBP: { locale: "en-GB", symbol: "£", decimals: 2 },
  CHF: { locale: "de-CH", symbol: "CHF", decimals: 2 },
  CAD: { locale: "en-CA", symbol: "C$", decimals: 2 },
  AUD: { locale: "en-AU", symbol: "A$", decimals: 2 },
};

export function calculateNextDate(
  currentDate: Date,
  frequency: IncomeFrequency,
): Date | null {
  if (frequency === "one-time") return null;

  const next = new Date(currentDate);
  if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === "annual") {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

export function formatCurrency(
  cents: number,
  currency: CurrencyCode = "USD",
): string {
  const config = CURRENCY_CONFIG[currency];
  const amount = cents / 100;

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

export function getCentAmount(dollars: number): number {
  return Math.round(dollars * 100);
}

export function getDollars(cents: number): number {
  return cents / 100;
}

export function getMonthsInRange(startDate: Date, endDate: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(startDate);
  current.setDate(1);

  while (current <= endDate) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

export function isRecurringInMonth(
  startDate: Date,
  endDate: Date | null,
  frequency: RecurringFrequency,
  targetMonth: Date,
): boolean {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const target = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const end = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    : null;

  if (start > target) return false;
  if (end && end < target) return false;

  const monthDiff =
    (target.getFullYear() - start.getFullYear()) * 12 +
    (target.getMonth() - start.getMonth());

  if (frequency === "one-time") {
    return monthDiff === 0;
  }

  if (frequency === "monthly") return monthDiff >= 0;
  if (frequency === "every-two-months") return monthDiff % 2 === 0;
  if (frequency === "bi-annual") return monthDiff % 6 === 0;

  if (frequency === "annual") {
    return monthDiff % 12 === 0;
  }

  return false;
}

export function generateMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}
