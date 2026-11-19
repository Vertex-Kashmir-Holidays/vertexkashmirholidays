"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { HotelNameInput } from "@/components/admin/HotelNameInput";
import { joinHotelChoices, parseHotelChoices } from "@/lib/proposal/hotelChoices";

const padRows = (list: string[], min: number): string[] => [
  ...list,
  ...Array<string>(Math.max(0, min - list.length)).fill(""),
];

/**
 * A proposal stay's hotel(s): one or more choices picked from the hotel list,
 * plus an optional "Similar", stored as "Hotel A / Hotel B / Similar" (what
 * the PDF prints). The final hotel is picked when the proposal is converted
 * to an itinerary. `inline` lays the choices side by side
 * (Hotel 1 | Hotel 2 | Hotel 3 | Similar); otherwise they stack.
 */
export function HotelChoicesInput({
  value,
  onValueChange,
  className,
  inline = false,
  destination,
}: {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  inline?: boolean;
  /** The stay's place — narrows the hotel suggestions to it. */
  destination?: string;
}) {
  // Inline (single-package): 3 hotel boxes ready by default; empty boxes are
  // never saved, so the PDF shows only the hotels actually entered.
  const minRows = inline ? 3 : 1;
  const pad = (list: string[]) => padRows(list, minRows);
  const parsed = parseHotelChoices(value);
  const [rows, setRows] = useState<string[]>(() => pad(parsed.choices));
  const [similar, setSimilar] = useState(parsed.similar);
  const lastEmitted = useRef(value);

  // Follow outside changes (reset, copy, undo) — not our own edits.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const p = parseHotelChoices(value);
    setRows(padRows(p.choices, minRows));
    setSimilar(p.similar);
    lastEmitted.current = value;
  }, [value, minRows]);

  function emit(nextRows: string[], nextSimilar: boolean) {
    setRows(pad(nextRows));
    setSimilar(nextSimilar);
    const out = joinHotelChoices(
      nextRows.filter((r) => r.trim()),
      nextSimilar,
    );
    lastEmitted.current = out;
    onValueChange(out);
  }

  const similarBtn = (
    <button
      type="button"
      onClick={() => emit(rows, !similar)}
      aria-pressed={similar}
      className={`inline-flex items-center justify-center gap-1 self-start rounded-md border px-3 py-1.5 text-xs font-semibold max-md:py-2 max-md:text-sm transition no-print ${
        inline ? "w-full" : ""
      } ${
        similar
          ? "border-primary bg-primary/10 text-primary"
          : "border-dashed border-[hsl(40_14%_87%)] text-muted-foreground hover:text-foreground dark:border-white/10"
      }`}
    >
      {similar && <Check className="h-3 w-3" />} Similar
    </button>
  );
  const addBtn = (
    <button
      type="button"
      onClick={() => setRows([...rows, ""])}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline no-print"
    >
      <Plus className="h-3 w-3" /> Add hotel
    </button>
  );

  return (
    <div className={inline ? "mt-1 space-y-1.5" : "space-y-1.5"}>
      <div className={inline ? "grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-x-3" : "space-y-1.5"}>
        {rows.map((r, i) => (
          <HotelNameInput
            key={i}
            value={r}
            onValueChange={(v) =>
              emit(
                rows.map((x, j) => (j === i ? v : x)),
                similar,
              )
            }
            placeholder={`Hotel ${i + 1}`}
            className={className}
            destination={destination}
            endAdornment={
              (rows.length > minRows || r.trim() !== "") && rows.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    emit(
                      rows.filter((_, j) => j !== i),
                      similar,
                    )
                  }
                  aria-label="Remove this hotel"
                  className="text-muted-foreground hover:text-rose-500 no-print"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : undefined
            }
          />
        ))}
        {inline && similarBtn}
      </div>
      <div className="flex items-center gap-3">
        {addBtn}
        {!inline && similarBtn}
      </div>
    </div>
  );
}
