"use client";

// Reusable double-click-to-edit cell for the Hotel Suppliers table. Explicit
// Save/Cancel by design — these are supplier financial rates, so nothing
// commits until the admin confirms (no autosave-on-keystroke). Local to this
// module: generalize only if a third table needs the same pattern.
import { useEffect, useRef, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface InlineCellProps {
  value: string;
  displayValue?: React.ReactNode;
  onSave: (value: string) => Promise<boolean>;
  type?: "text" | "number" | "date" | "select";
  options?: SelectOption[];
  placeholder?: string;
  canEdit: boolean;
  align?: "left" | "right";
  className?: string;
}

export function InlineCell({
  value,
  displayValue,
  onSave,
  type = "text",
  options,
  placeholder,
  canEdit,
  align = "left",
  className,
}: InlineCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    setDraft(value);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const empty = <span className="text-muted-foreground/50">—</span>;

  if (!canEdit) {
    return (
      <div className={cn("px-3 py-2.5 text-sm", align === "right" && "text-right", className)}>
        {displayValue ?? (value || empty)}
      </div>
    );
  }

  if (!editing) {
    return (
      <div
        onDoubleClick={() => setEditing(true)}
        title="Double-click to edit"
        className={cn(
          "px-3 py-2.5 text-sm cursor-text rounded-md transition-colors hover:bg-primary/5 hover:ring-1 hover:ring-primary/20",
          align === "right" && "text-right",
          className,
        )}
      >
        {displayValue ?? (value || empty)}
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) setEditing(false);
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-1 px-1.5 py-1.5">
      {type === "select" ? (
        <select
          ref={inputRef as unknown as React.RefObject<HTMLSelectElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={saving}
          className="w-full min-w-0 rounded-md border border-primary/40 bg-card px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/25"
        >
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          disabled={saving}
          step={type === "number" ? "1" : undefined}
          min={type === "number" ? 0 : undefined}
          className={cn(
            "w-full min-w-0 rounded-md border border-primary/40 bg-card px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/25",
            align === "right" && "text-right",
          )}
        />
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        title="Save"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={saving}
        title="Cancel"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
