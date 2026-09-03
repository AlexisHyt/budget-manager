/**
 * Shared tag constants used by the tag selector and the API validation.
 */

export const TAG_COLORS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#22c55e", // green
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
  "#ec4899", // pink
] as const;

export const DEFAULT_TAG_COLOR = TAG_COLORS[0];

export const TAG_NAME_MAX_LENGTH = 32;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isValidTagColor(color: unknown): color is string {
  return typeof color === "string" && HEX_COLOR_PATTERN.test(color);
}

export function normalizeTagName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0 || trimmed.length > TAG_NAME_MAX_LENGTH) return null;
  return trimmed;
}

const PG_UNIQUE_VIOLATION = "23505";

/**
 * The (user_id, name) unique index is the only constraint tag writes can trip.
 * Drizzle wraps the driver error in a DrizzleQueryError, so the pg error code
 * lives on `cause` rather than on the thrown error itself.
 */
export function isDuplicateTagError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const { code, cause } = error as { code?: string; cause?: unknown };
  if (code === PG_UNIQUE_VIOLATION) return true;

  return (
    typeof cause === "object" &&
    cause !== null &&
    (cause as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}
