import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface TagLike {
  id: string;
  name: string;
  color: string;
}

export function tagChipStyle(color: string, selected = true): CSSProperties {
  return selected
    ? {
        borderColor: `${color}66`,
        backgroundColor: `${color}18`,
      }
    : {};
}

export function TagBadge({
  tag,
  className,
}: {
  tag: TagLike;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={tagChipStyle(tag.color)}
    >
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
    </span>
  );
}

/**
 * Dot-only rendering, for the tight sticky column of the breakdown table.
 */
export function TagDots({ tags }: { tags: TagLike[] }) {
  if (tags.length === 0) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: tag.color }}
          title={tag.name}
        />
      ))}
    </span>
  );
}
