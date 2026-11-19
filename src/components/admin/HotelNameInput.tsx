"use client";

import { useEffect, useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { stayMatchesHotelDestination } from "@/lib/hotelSuppliers/destinationMatch";

export interface HotelNameOption {
  id: string;
  name: string;
  destination: string;
}

// Fetched once per page load and shared by every picker on the page.
let cache: Promise<HotelNameOption[]> | null = null;
function loadHotelNames(): Promise<HotelNameOption[]> {
  cache ??= fetch("/api/hotel-suppliers/names")
    .then((r) => (r.ok ? (r.json() as Promise<HotelNameOption[]>) : []))
    .catch(() => {
      cache = null;
      return [];
    });
  return cache;
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Hotel name field that suggests hotels from the hotel list (Hotel Rates) as
 * you type, so the same spelling carries from proposal → itinerary → booking
 * services and the stay links to the hotel at conversion. Any name can still
 * be typed; a small tag shows whether it matches the list.
 */
export function HotelNameInput({
  value,
  onValueChange,
  className,
  endAdornment,
  destination,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "list"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Shown inside the input's right edge (e.g. a remove button). */
  endAdornment?: React.ReactNode;
  /** The stay's place — suggestions are narrowed to hotels there (all hotels
   *  when it's empty or matches none). */
  destination?: string;
}) {
  const listId = useId();
  const [options, setOptions] = useState<HotelNameOption[]>([]);
  useEffect(() => {
    let alive = true;
    void loadHotelNames().then((o) => alive && setOptions(o));
    return () => {
      alive = false;
    };
  }, []);

  const inList = !!value.trim() && options.some((o) => norm(o.name) === norm(value));
  const here = destination?.trim()
    ? options.filter((o) => stayMatchesHotelDestination(destination, o.destination))
    : [];
  const suggestions = here.length > 0 ? here : options;

  return (
    <span className="block">
      <span className="relative block">
        <input
          {...props}
          list={listId}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          autoComplete="off"
          className={cn(className, endAdornment ? "pr-8" : "")}
        />
        {endAdornment && (
          <span className="absolute inset-y-0 right-2 flex items-center">{endAdornment}</span>
        )}
      </span>
      <datalist id={listId}>
        {suggestions.map((o) => (
          <option key={o.id} value={o.name}>
            {o.destination}
          </option>
        ))}
      </datalist>
      {value.trim() && options.length > 0 && (
        <span
          className={cn(
            "mt-0.5 block text-[10px] font-semibold no-print",
            inList
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400",
          )}
        >
          {inList ? "✓ In hotel list" : "Not in hotel list"}
        </span>
      )}
    </span>
  );
}
