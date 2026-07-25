import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { incomes } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";
import { calculateNextDate } from "@/lib/budget/utils";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const income = await db
      .select()
      .from(incomes)
      .where(and(eq(incomes.id, id), eq(incomes.userId, session.user.id)))
      .limit(1);

    if (income.length === 0) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json(income[0]);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch income" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { name, amount, frequency, startDate, bankAccountId } =
      await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (amount !== undefined) updateData.amount = Math.round(amount * 100);
    if (frequency) {
      updateData.frequency = frequency;
      if (startDate) {
        const start = new Date(startDate);
        updateData.nextDate = calculateNextDate(start, frequency);
      }
    }
    if (startDate) updateData.startDate = new Date(startDate);
    if (bankAccountId !== undefined) updateData.bankAccountId = bankAccountId;

    const updated = await db
      .update(incomes)
      .set(updateData)
      .where(and(eq(incomes.id, id), eq(incomes.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update income" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const deleted = await db
      .delete(incomes)
      .where(and(eq(incomes.id, id), eq(incomes.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete income" },
      { status: 500 },
    );
  }
}
