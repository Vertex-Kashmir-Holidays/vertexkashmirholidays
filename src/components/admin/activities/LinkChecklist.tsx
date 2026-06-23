"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface LinkOption {
  id: string;
  label: string;
}

// Searchable checkbox list for editing a many-to-many link set (activities ↔
// destinations/tours). Value is the selected id array; onChange returns the new set.
export function LinkChecklist({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: LinkOption[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? options.filter((o) => o.label.toLowerCase().includes(term)) : options;
  }, [options, q]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-bold text-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground">{value.length} selected</span>
      </div>
      <div className="p-2">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full pl-8 pr-2 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {shown.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic px-1 py-2">No options.</p>
          ) : (
            shown.map((o) => (
              <label key={o.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted cursor-pointer">
                <input type="checkbox" checked={value.includes(o.id)} onChange={() => toggle(o.id)} className="h-3.5 w-3.5 accent-primary" />
                <span className="truncate">{o.label}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
