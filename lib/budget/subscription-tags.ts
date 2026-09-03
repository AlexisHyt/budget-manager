import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { subscriptionTags, type Tag, tags } from "@/drizzle/schema";

/**
 * Loads every tag of the user, grouped by the subscription it is attached to.
 * The join is scoped on the tag owner so a subscription can never surface a
 * tag belonging to somebody else.
 */
export async function getTagsBySubscriptionId(
  userId: string,
): Promise<Map<string, Tag[]>> {
  const rows = await db
    .select({ subscriptionId: subscriptionTags.subscriptionId, tag: tags })
    .from(subscriptionTags)
    .innerJoin(tags, eq(subscriptionTags.tagId, tags.id))
    .where(eq(tags.userId, userId))
    .orderBy(tags.name);

  const map = new Map<string, Tag[]>();
  rows.forEach((row) => {
    const existing = map.get(row.subscriptionId);
    if (existing) {
      existing.push(row.tag);
    } else {
      map.set(row.subscriptionId, [row.tag]);
    }
  });

  return map;
}

export async function getTagsForSubscription(
  userId: string,
  subscriptionId: string,
): Promise<Tag[]> {
  const rows = await db
    .select({ tag: tags })
    .from(subscriptionTags)
    .innerJoin(tags, eq(subscriptionTags.tagId, tags.id))
    .where(
      and(
        eq(subscriptionTags.subscriptionId, subscriptionId),
        eq(tags.userId, userId),
      ),
    )
    .orderBy(tags.name);

  return rows.map((row) => row.tag);
}

/**
 * Returns the de-duplicated ids that actually belong to the user, or null when
 * the payload is not a list of strings.
 */
export function parseTagIds(tagIds: unknown): string[] | null {
  if (!Array.isArray(tagIds)) return null;
  if (tagIds.some((id) => typeof id !== "string")) return null;
  return [...new Set(tagIds as string[])];
}

export async function ownsAllTags(
  userId: string,
  tagIds: string[],
): Promise<boolean> {
  if (tagIds.length === 0) return true;

  const owned = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(inArray(tags.id, tagIds), eq(tags.userId, userId)));

  return owned.length === tagIds.length;
}

/**
 * Replaces the whole tag set of a subscription in one transaction.
 */
export async function setSubscriptionTags(
  subscriptionId: string,
  tagIds: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(subscriptionTags)
      .where(eq(subscriptionTags.subscriptionId, subscriptionId));

    if (tagIds.length > 0) {
      await tx
        .insert(subscriptionTags)
        .values(tagIds.map((tagId) => ({ subscriptionId, tagId })));
    }
  });
}
