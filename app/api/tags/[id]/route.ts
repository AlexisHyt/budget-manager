import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { tags } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";
import {
  isDuplicateTagError,
  isValidTagColor,
  normalizeTagName,
} from "@/lib/budget/tags";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { name, color } = await request.json();

    const updateData: Partial<{
      name: string;
      color: string;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      const normalizedName = normalizeTagName(name);
      if (!normalizedName) {
        return NextResponse.json(
          { error: "Invalid tag name" },
          { status: 400 },
        );
      }
      updateData.name = normalizedName;
    }
    if (color !== undefined) {
      if (!isValidTagColor(color)) {
        return NextResponse.json(
          { error: "Invalid tag color" },
          { status: 400 },
        );
      }
      updateData.color = color;
    }

    const updated = await db
      .update(tags)
      .set(updateData)
      .where(and(eq(tags.id, id), eq(tags.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    if (isDuplicateTagError(error)) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update tag" },
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
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 },
    );
  }
}
