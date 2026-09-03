"use client";

import { useState } from "react";
import { tagChipStyle } from "@/components/dashboard/tag-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tag } from "@/drizzle/schema";
import {
  DEFAULT_TAG_COLOR,
  TAG_COLORS,
  TAG_NAME_MAX_LENGTH,
} from "@/lib/budget/tags";

interface TagSelectorProps {
  tags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onTagsMutated: () => Promise<void> | void;
}

function ColorPalette({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TAG_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Use color ${color}`}
          onClick={() => onSelect(color)}
          className={
            value === color
              ? "h-5 w-5 rounded-full ring-2 ring-foreground ring-offset-2 ring-offset-background"
              : "h-5 w-5 rounded-full opacity-70 transition-opacity hover:opacity-100"
          }
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function TagManageRow({
  tag,
  onMutated,
  onDeleted,
  onError,
}: {
  tag: Tag;
  onMutated: () => Promise<void> | void;
  onDeleted: (id: string) => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();
  const dirty = trimmed !== tag.name || color !== tag.color;

  const save = async () => {
    if (!dirty || trimmed.length === 0) return;
    setBusy(true);
    onError(null);
    try {
      const response = await fetch(`/api/tags/${tag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, color }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        onError(body?.error || "Failed to update tag");
        return;
      }
      await onMutated();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete the tag "${tag.name}"?`)) return;
    setBusy(true);
    onError(null);
    try {
      const response = await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });
      if (!response.ok) {
        onError("Failed to delete tag");
        return;
      }
      onDeleted(tag.id);
      await onMutated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2 py-2">
      <div className="w-40">
        <Input
          value={name}
          maxLength={TAG_NAME_MAX_LENGTH}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <ColorPalette value={color} onSelect={setColor} />
      <div className="ml-auto flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={!dirty || busy || trimmed.length === 0}
          onClick={save}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={remove}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export function TagSelector({
  tags,
  selectedIds,
  onChange,
  onTagsMutated,
}: TagSelectorProps) {
  const [managing, setManaging] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(DEFAULT_TAG_COLOR);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selected) => selected !== id)
        : [...selectedIds, id],
    );
  };

  const createTag = async () => {
    const trimmed = newName.trim();
    if (trimmed.length === 0 || creating) return;

    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, color: newColor }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error || "Failed to create tag");
        return;
      }
      const created: Tag = await response.json();
      setNewName("");
      await onTagsMutated();
      onChange([...selectedIds, created.id]);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>Tags (Optional)</Label>
        {tags.length > 0 && (
          <button
            type="button"
            onClick={() => setManaging(!managing)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {managing ? "Done" : "Manage tags"}
          </button>
        )}
      </div>

      {managing ? (
        <div className="mt-1.5 space-y-2">
          {tags.map((tag) => (
            <TagManageRow
              key={tag.id}
              tag={tag}
              onMutated={onTagsMutated}
              onDeleted={(id) =>
                onChange(selectedIds.filter((selected) => selected !== id))
              }
              onError={setError}
            />
          ))}
        </div>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {tags.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No tag yet — create one below.
            </p>
          )}
          {tags.map((tag) => {
            const selected = selectedIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={
                  selected
                    ? "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                    : "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                }
                style={tagChipStyle(tag.color, selected)}
              >
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: selected ? tag.color : "transparent",
                    boxShadow: selected
                      ? undefined
                      : `inset 0 0 0 1px ${tag.color}`,
                  }}
                />
                {tag.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Input
            value={newName}
            maxLength={TAG_NAME_MAX_LENGTH}
            placeholder="New tag name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createTag();
              }
            }}
          />
        </div>
        <ColorPalette value={newColor} onSelect={setNewColor} />
        <Button
          size="sm"
          variant="outline"
          disabled={creating || newName.trim().length === 0}
          onClick={createTag}
        >
          {creating ? "Adding..." : "Add tag"}
        </Button>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
