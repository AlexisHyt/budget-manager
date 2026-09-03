import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { tags } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";
import {
  DEFAULT_TAG_COLOR,
  isDuplicateTagError,
  isValidTagColor,
  normalizeTagName,
} from "@/lib/budget/tags";

export async function GET() {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, session.user.id))
      .orderBy(tags.name);

    return NextResponse.json(userTags);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch tags" },
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

    const normalizedName = normalizeTagName(name);
    if (!normalizedName) {
      return NextResponse.json({ error: "Invalid tag name" }, { status: 400 });
    }
    if (color !== undefined && color !== null && !isValidTagColor(color)) {
      return NextResponse.json({ error: "Invalid tag color" }, { status: 400 });
    }

    const id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTag = await db
      .insert(tags)
      .values({
        id,
        userId: session.user.id,
        name: normalizedName,
        color: color || DEFAULT_TAG_COLOR,
      })
      .returning();

    return NextResponse.json(newTag[0], { status: 201 });
  } catch (error) {
    if (isDuplicateTagError(error)) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 },
    );
  }
}
