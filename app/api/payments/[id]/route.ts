import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { payments } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const payment = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.userId, session.user.id)))
      .limit(1);

    if (payment.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(payment[0]);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch payment" },
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
    const {
      name,
      amount,
      dueDate,
      bankAccountId,
      status,
      paidDate,
      completed,
    } = await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (amount !== undefined) updateData.amount = Math.round(amount * 100);
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (bankAccountId) updateData.bankAccountId = bankAccountId;
    if (status) updateData.status = status;
    if (paidDate !== undefined)
      updateData.paidDate = paidDate ? new Date(paidDate) : null;
    if (completed !== undefined) updateData.completed = completed;

    const updated = await db
      .update(payments)
      .set(updateData)
      .where(and(eq(payments.id, id), eq(payments.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update payment" },
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
      .delete(payments)
      .where(and(eq(payments.id, id), eq(payments.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 },
    );
  }
}
