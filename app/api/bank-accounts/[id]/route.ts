import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { bankAccounts } from "@/drizzle/schema";
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
    const account = await db
      .select()
      .from(bankAccounts)
      .where(
        and(eq(bankAccounts.id, id), eq(bankAccounts.userId, session.user.id)),
      )
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account[0]);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch account" },
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
    const { name, color, balance } = await request.json();

    const updated = await db
      .update(bankAccounts)
      .set({
        ...(name && { name }),
        ...(color && { color }),
        ...(balance !== undefined && { balance }),
        updatedAt: new Date(),
      })
      .where(
        and(eq(bankAccounts.id, id), eq(bankAccounts.userId, session.user.id)),
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update account" },
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
      .delete(bankAccounts)
      .where(
        and(eq(bankAccounts.id, id), eq(bankAccounts.userId, session.user.id)),
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
