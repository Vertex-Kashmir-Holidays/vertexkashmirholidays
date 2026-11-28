"use client";

import { Trash2 } from "lucide-react";

// One editable "chip" (tag, payment method, highlight point) in the proposal
// and itinerary editors: a bordered full-width input with an always-visible
// delete icon. The PDFs still print these as chips.
export function ChipInput({
  value,
  onChange,
  onRemove,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  /** Accessible name, e.g. "Tag 2". */
  label: string;
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full rounded-md border border-[hsl(40_14%_87%)]/80 bg-transparent py-1.5 pl-2 pr-8 text-sm font-semibold outline-none transition-all focus:bg-muted/30 focus:ring-1 focus:ring-primary/30 dark:border-white/10 max-md:text-[16px]"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${value || label}`}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-600 no-print"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
