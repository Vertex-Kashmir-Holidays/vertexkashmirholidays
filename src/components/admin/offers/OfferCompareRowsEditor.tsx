"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import {
  COMPARE_GROUPS,
  COMPARE_INCLUDED,
  COMPARE_NOT_INCLUDED,
  SUGGESTED_COMPARE_ROWS,
  type OfferCompareRow,
} from "@/lib/offers/content";
import type { PackageDraft } from "./OfferPackagesEditor";

// Extra Compare Plans rows (Activities › Gondola ride, Transport › ABC Union …)
// as a matrix: one line per row, one value per plan. A value of "Included"
// shows a ✓, "Not included" or blank shows —, any other text (e.g. "Phase 1
// + 2", "Innova") is shown as written. Stay nights, meals and vehicle rows are
// generated from each plan's own fields — no need to add them here.

const cell =
  "w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";

const newRowId = () => `r${Math.random().toString(36).slice(2, 10)}`;

export function OfferCompareRowsEditor({
  rows,
  onRowsChange,
  packages,
  onPackagesChange,
}: {
  rows: OfferCompareRow[];
  onRowsChange: (next: OfferCompareRow[]) => void;
  packages: PackageDraft[];
  onPackagesChange: (next: PackageDraft[]) => void;
}) {
  const updateRow = (id: string, patch: Partial<OfferCompareRow>) =>
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...rows];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onRowsChange(next);
  };
  const setValue = (pkgKey: string, rowId: string, value: string) =>
    onPackagesChange(
      packages.map((p) =>
        p.key === pkgKey ? { ...p, compareValues: { ...p.compareValues, [rowId]: value } } : p,
      ),
    );
  const addSuggested = () =>
    onRowsChange([
      ...rows,
      ...SUGGESTED_COMPARE_ROWS.filter(
        (s) => !rows.some((r) => r.group === s.group && r.label === s.label),
      ).map((s) => ({ ...s, id: newRowId() })),
    ]);

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-muted-foreground">
        Extra rows for the public Compare Plans table, grouped into sections (Activities, Transport,
        …). Per plan, type <b>{COMPARE_INCLUDED}</b> (✓), <b>{COMPARE_NOT_INCLUDED}</b> (—) or any
        short text, e.g. “Phase 1 + 2”. Nights, stay class, meal plan and vehicle rows come from
        each plan automatically.
      </p>
      <datalist id="compare-groups">
        {COMPARE_GROUPS.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      <datalist id="compare-values">
        <option value={COMPARE_INCLUDED} />
        <option value={COMPARE_NOT_INCLUDED} />
      </datalist>

      {rows.length > 0 && packages.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-muted text-left text-[12px] font-bold text-muted-foreground">
                <th className="px-2 py-2">Group</th>
                <th className="px-2 py-2">Row</th>
                {packages.map((p) => (
                  <th key={p.key} className="px-2 py-2">
                    {p.name || "New plan"}
                  </th>
                ))}
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="w-32 px-2 py-1.5">
                    <input
                      list="compare-groups"
                      aria-label="Group"
                      value={r.group}
                      onChange={(e) => updateRow(r.id, { group: e.target.value })}
                      className={cell}
                    />
                  </td>
                  <td className="w-48 px-2 py-1.5">
                    <input
                      aria-label="Row name"
                      value={r.label}
                      onChange={(e) => updateRow(r.id, { label: e.target.value })}
                      className={cell}
                      placeholder="e.g. Gondola ride"
                    />
                  </td>
                  {packages.map((p) => (
                    <td key={p.key} className="px-2 py-1.5">
                      <input
                        list="compare-values"
                        aria-label={`${r.label || "Row"} — ${p.name || "plan"}`}
                        value={p.compareValues[r.id] ?? ""}
                        onChange={(e) => setValue(p.key, r.id, e.target.value)}
                        className={cell}
                        placeholder="—"
                      />
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-1 py-1.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === rows.length - 1}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRowsChange(rows.filter((x) => x.id !== r.id))}
                      className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onRowsChange([...rows, { id: newRowId(), group: "Activities", label: "" }])
          }
          className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Add row
        </button>
        <button
          type="button"
          onClick={addSuggested}
          className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
        >
          Add suggested rows (Gondola, Shikara, ATV, ABC Union, Sonamarg Union)
        </button>
      </div>
    </div>
  );
}
