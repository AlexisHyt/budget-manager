import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { subscriptions } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";
import {
  getTagsForSubscription,
  ownsAllTags,
  parseTagIds,
  setSubscriptionTags,
} from "@/lib/budget/subscription-tags";

const validSubscriptionFrequencies = [
  "monthly",
  "every-two-months",
  "bi-annual",
  "annual",
] as const;

const validIndicators = ["important", "ok", "fine", "to-remove"] as const;

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, id),
          eq(subscriptions.userId, session.user.id),
        ),
      )
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...subscription[0],
      tags: await getTagsForSubscription(session.user.id, id),
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
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
      frequency,
      startDate,
      endDate,
      bankAccountId,
      imageUrl,
      active,
      indicator,
      tagIds,
    } = await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (amount !== undefined) updateData.amount = Math.round(amount * 100);
    if (frequency) {
      if (!validSubscriptionFrequencies.includes(frequency)) {
        return NextResponse.json(
          { error: "Invalid subscription frequency" },
          { status: 400 },
        );
      }
      updateData.frequency = frequency;
    }
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;
    if (bankAccountId) updateData.bankAccountId = bankAccountId;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (active !== undefined) updateData.active = active;
    if (indicator !== undefined) {
      if (indicator !== null && !validIndicators.includes(indicator)) {
        return NextResponse.json(
          { error: "Invalid indicator" },
          { status: 400 },
        );
      }
      updateData.indicator = indicator;
    }

    let requestedTagIds: string[] | null = null;
    if (tagIds !== undefined) {
      requestedTagIds = parseTagIds(tagIds);
      if (requestedTagIds === null) {
        return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
      }
      if (!(await ownsAllTags(session.user.id, requestedTagIds))) {
        return NextResponse.json({ error: "Unknown tag" }, { status: 400 });
      }
    }

    const updated = await db
      .update(subscriptions)
      .set(updateData)
      .where(
        and(
          eq(subscriptions.id, id),
          eq(subscriptions.userId, session.user.id),
        ),
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    if (requestedTagIds !== null) {
      await setSubscriptionTags(id, requestedTagIds);
    }

    return NextResponse.json({
      ...updated[0],
      tags: await getTagsForSubscription(session.user.id, id),
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update subscription" },
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
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.id, id),
          eq(subscriptions.userId, session.user.id),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 },
    );
  }
}
