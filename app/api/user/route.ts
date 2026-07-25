import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!userData.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: userData[0].id,
      name: userData[0].name,
      email: userData[0].email,
      currency: userData[0].currency,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
