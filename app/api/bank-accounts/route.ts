import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { bankAccounts } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.redirect("/");

  try {
    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, session.user.id));

    return NextResponse.json(accounts);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, color } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 },
      );
    }

    const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAccount = await db
      .insert(bankAccounts)
      .values({
        id,
        userId: session.user.id,
        name,
        color,
        balance: 0,
      })
      .returning();

    return NextResponse.json(newAccount[0], { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
