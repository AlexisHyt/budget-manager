import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";

const VALID_CURRENCIES = ["USD", "EUR", "JPY", "GBP", "CHF", "CAD", "AUD"];

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { currency } = await request.json();

    if (!currency || !VALID_CURRENCIES.includes(currency)) {
      return NextResponse.json(
        {
          error:
            "Invalid currency. Valid currencies: " +
            VALID_CURRENCIES.join(", "),
        },
        { status: 400 },
      );
    }

    const updatedUser = await db
      .update(user)
      .set({ currency })
      .where(eq(user.id, session.user.id))
      .returning();

    return NextResponse.json(updatedUser[0]);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update currency" },
      { status: 500 },
    );
  }
}
