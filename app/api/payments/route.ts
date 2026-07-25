import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { payments } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, session.user.id));

    return NextResponse.json(userPayments);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, amount, dueDate, bankAccountId, status } =
      await request.json();

    if (!name || !amount || !dueDate || !bankAccountId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const id = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPayment = await db
      .insert(payments)
      .values({
        id,
        userId: session.user.id,
        name,
        amount: Math.round(amount * 100),
        dueDate: new Date(dueDate),
        bankAccountId,
        status: status || "pending",
        paidDate: null,
        completed: false,
      })
      .returning();

    return NextResponse.json(newPayment[0], { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}
