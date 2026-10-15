"use client";

import { Trash2, Plus } from "lucide-react";
import { EditableField } from "./EditableField";
import type { PriceActivityItem } from "@/types/itinerary";

/** Editable "pay locally" price rows (name/place/day/note/price) — the
 *  itinerary's Available on the Day + Local Taxi lists and the proposal's
 *  Available on the Day list. */
export function PriceActivitySection({
  title,
  items,
  onUpdate,
  onRemove,
  onAdd,
  addLabel,
}: {
  title: string;
  items: PriceActivityItem[];
  onUpdate: (id: string, field: "name" | "place" | "day" | "note" | "price", v: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-4">
        <h3 className="font-serif text-xl font-bold text-[hsl(156_40%_21%)] dark:text-primary">
          {title}
        </h3>
        <span className="h-px flex-1 bg-[hsl(40_14%_87%)] dark:bg-mute/20" />
      </div>
      <div className="mt-4 space-y-3">
        {items.map((a, idx) => (
          <div
            key={a.id}
            className="group relative grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-[hsl(40_14%_87%)] p-3 pr-8 dark:border-mute/20 sm:grid-cols-6"
          >
            <EditableField
              value={a.name}
              onValueChange={(v) => onUpdate(a.id, "name", v)}
              placeholder="Name"
              className="text-sm font-bold sm:col-span-2"
            />
            <EditableField
              value={a.place}
              onValueChange={(v) => onUpdate(a.id, "place", v)}
              placeholder="Place"
              className="text-xs text-mute dark:text-muted-foreground"
            />
            <EditableField
              value={a.day}
              onValueChange={(v) => onUpdate(a.id, "day", v)}
              placeholder="Day 02"
              className="text-xs text-mute dark:text-muted-foreground"
            />
            <EditableField
              value={a.note}
              onValueChange={(v) => onUpdate(a.id, "note", v)}
              placeholder="Note"
              className="text-xs text-mute dark:text-muted-foreground"
            />
            <EditableField
              value={a.price}
              onValueChange={(v) => onUpdate(a.id, "price", v)}
              placeholder="Rs. 840 pp"
              className="text-right text-xs font-bold text-[hsl(156_40%_21%)] dark:text-primary"
            />
            <button
              onClick={() => onRemove(a.id)}
              aria-label={`Remove ${title} row ${idx + 1}`}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 text-rose-500 hover:text-rose-600 group-hover:block no-print [@media(hover:none)]:block"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        className="addbtn mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-3 py-1.5 text-xs font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print"
      >
        <Plus className="h-3 w-3" /> {addLabel}
      </button>
    </div>
  );
}
