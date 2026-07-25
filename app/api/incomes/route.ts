import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { incomes } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";
import { calculateNextDate } from "@/lib/budget/utils";

export async function GET() {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userIncomes = await db
      .select()
      .from(incomes)
      .where(eq(incomes.userId, session.user.id));

    return NextResponse.json(userIncomes);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch incomes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, amount, frequency, startDate, bankAccountId } =
      await request.json();

    if (!name || !amount || !frequency || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    const nextDate = calculateNextDate(start, frequency);

    const id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newIncome = await db
      .insert(incomes)
      .values({
        id,
        userId: session.user.id,
        name,
        amount: Math.round(amount * 100),
        frequency,
        startDate: start,
        nextDate,
        bankAccountId: bankAccountId || null,
      })
      .returning();

    return NextResponse.json(newIncome[0], { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create income" },
      { status: 500 },
    );
  }
}
