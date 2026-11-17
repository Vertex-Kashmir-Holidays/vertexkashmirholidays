"use client";

import { Trash2, Plus } from "lucide-react";
import type { PriceActivityItem } from "@/types/itinerary";

/** Editable "pay locally" price rows (name/place/day/note/price) — the
 *  itinerary's Available on the Day + Local Taxi lists and the proposal's
 *  Available on the Day list. */
const LABEL =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-mute dark:text-muted-foreground";
const INPUT =
  "w-full rounded-md border border-[hsl(40_14%_87%)]/80 bg-transparent px-2 py-1.5 text-sm outline-none transition-all focus:bg-muted/30 focus:ring-1 focus:ring-primary/30 dark:border-white/10 max-md:text-[16px]";

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
          // One card per row with labelled inputs (phones: Name / Place + Day /
          // Note / Price; sm+: Name, Place, Day on one row, Note + Price below).
          <div
            key={a.id}
            className="relative grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-[hsl(40_14%_87%)] p-3 pr-10 dark:border-mute/20 sm:grid-cols-4"
          >
            <div className="col-span-2">
              <label className={LABEL}>Name</label>
              <input
                value={a.name}
                onChange={(e) => onUpdate(a.id, "name", e.target.value)}
                placeholder="Gondola ride"
                className={`${INPUT} font-bold`}
              />
            </div>
            <div className="">
              <label className={LABEL}>Place</label>
              <input
                value={a.place}
                onChange={(e) => onUpdate(a.id, "place", e.target.value)}
                placeholder="Gulmarg"
                className={`${INPUT}`}
              />
            </div>
            <div className="">
              <label className={LABEL}>Day</label>
              <input
                value={a.day}
                onChange={(e) => onUpdate(a.id, "day", e.target.value)}
                placeholder="Day 02"
                className={`${INPUT}`}
              />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className={LABEL}>Note</label>
              <input
                value={a.note}
                onChange={(e) => onUpdate(a.id, "note", e.target.value)}
                placeholder="e.g. Phase 1 only"
                className={`${INPUT}`}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={LABEL}>Price</label>
              <input
                value={a.price}
                onChange={(e) => onUpdate(a.id, "price", e.target.value)}
                placeholder="Rs. 840 pp"
                className={`${INPUT} font-bold text-[hsl(156_40%_21%)] dark:text-primary`}
              />
            </div>
            <button
              onClick={() => onRemove(a.id)}
              aria-label={`Remove ${title} row ${idx + 1}`}
              className="absolute right-3 top-3 text-rose-500 hover:text-rose-600 no-print"
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
