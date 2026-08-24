"use client";

// The Hotel Name cell doubles as the Google Maps link, so editing it needs
// two fields (name + map URL) at once rather than InlineCell's single-value
// contract. Same explicit double-click -> Save/Cancel pattern, just for a
// compound value — kept local to this one cell rather than generalizing
// InlineCell for a case that only happens once.
import { useEffect, useRef, useState } from "react";
import { Check, X, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface NameCellProps {
  hotelName: string;
  mapUrl: string | null;
  canEdit: boolean;
  onSave: (values: { hotelName: string; mapUrl: string }) => Promise<boolean>;
  className?: string;
}

export function NameCell({ hotelName, mapUrl, canEdit, onSave, className }: NameCellProps) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(hotelName);
  const [mapDraft, setMapDraft] = useState(mapUrl ?? "");
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    setNameDraft(hotelName);
    setMapDraft(mapUrl ?? "");
    const id = requestAnimationFrame(() => nameInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const display = mapUrl ? (
    <a
      href={mapUrl}
      target="_blank"
      rel="noreferrer"
      title="Open in Google Maps"
      className="inline-flex items-center gap-1 hover:text-primary hover:underline"
    >
      {hotelName}
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  ) : (
    hotelName
  );

  if (!canEdit) {
    return <div className={cn("px-3 py-2.5 text-sm", className)}>{display}</div>;
  }

  if (!editing) {
    return (
      <div
        onDoubleClick={() => setEditing(true)}
        title="Double-click to edit name / map link"
        className={cn(
          "px-3 py-2.5 text-sm cursor-text rounded-md transition-colors hover:bg-primary/5 hover:ring-1 hover:ring-primary/20",
          className,
        )}
      >
        {display}
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    const ok = await onSave({ hotelName: nameDraft, mapUrl: mapDraft });
    setSaving(false);
    if (ok) setEditing(false);
  }

  function handleCancel() {
    setNameDraft(hotelName);
    setMapDraft(mapUrl ?? "");
    setEditing(false);
  }

  return (
    <div className="min-w-[220px] space-y-1 px-1.5 py-1.5">
      <input
        ref={nameInputRef}
        value={nameDraft}
        placeholder="Hotel name"
        onChange={(e) => setNameDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && handleCancel()}
        disabled={saving}
        className="w-full rounded-md border border-primary/40 bg-card px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"
      />
      <input
        value={mapDraft}
        placeholder="Google Maps URL"
        onChange={(e) => setMapDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
        disabled={saving}
        className="w-full rounded-md border border-primary/40 bg-card px-2 py-1 text-xs text-muted-foreground outline-none focus:ring-2 focus:ring-primary/25"
      />
      <div className="flex items-center justify-end gap-1">
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
    </div>
  );
}
