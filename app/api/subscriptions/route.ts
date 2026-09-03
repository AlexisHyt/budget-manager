import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { subscriptions } from "@/drizzle/schema";
import { requireSession } from "@/lib/auth/session";
import {
  getTagsBySubscriptionId,
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

export async function GET() {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [userSubscriptions, tagsBySubscriptionId] = await Promise.all([
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id))
        .orderBy(subscriptions.name),
      getTagsBySubscriptionId(session.user.id),
    ]);

    return NextResponse.json(
      userSubscriptions.map((sub) => ({
        ...sub,
        tags: tagsBySubscriptionId.get(sub.id) ?? [],
      })),
    );
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const {
      name,
      amount,
      frequency,
      startDate,
      endDate,
      bankAccountId,
      imageUrl,
      indicator,
      tagIds,
    } = await request.json();

    if (!name || !amount || !frequency || !startDate || !bankAccountId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (!validSubscriptionFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: "Invalid subscription frequency" },
        { status: 400 },
      );
    }
    if (indicator && !validIndicators.includes(indicator)) {
      return NextResponse.json({ error: "Invalid indicator" }, { status: 400 });
    }

    const requestedTagIds = tagIds === undefined ? [] : parseTagIds(tagIds);
    if (requestedTagIds === null) {
      return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
    }
    if (!(await ownsAllTags(session.user.id, requestedTagIds))) {
      return NextResponse.json({ error: "Unknown tag" }, { status: 400 });
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSubscription = await db
      .insert(subscriptions)
      .values({
        id,
        userId: session.user.id,
        name,
        amount: Math.round(amount * 100),
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        bankAccountId,
        imageUrl: imageUrl || null,
        indicator: indicator || null,
        active: true,
      })
      .returning();

    if (requestedTagIds.length > 0) {
      await setSubscriptionTags(id, requestedTagIds);
    }

    return NextResponse.json(
      {
        ...newSubscription[0],
        tags: await getTagsForSubscription(session.user.id, id),
      },
      { status: 201 },
    );
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
