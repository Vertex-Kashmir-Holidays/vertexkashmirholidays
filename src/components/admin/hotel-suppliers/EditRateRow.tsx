"use client";

// Batch rate editor — appears inline under a hotel's row when Admin clicks
// "Add Rate" / "Edit Rate". Lets MAP/CP/Extra Bed/Valid Till be set together
// in one Save, rather than double-clicking each cell separately. Always
// edits the hotel's single current rate (never appends a second one) — the
// business always maintains exactly one season's rate per hotel.
import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import type { HotelRate } from "@/lib/hotelSuppliers/schema";

interface EditRateRowProps {
  initialRate: HotelRate | null;
  onSave: (rate: HotelRate) => Promise<boolean>;
  onCancel: () => void;
  colSpanBefore: number;
}

const cellCls = "px-1.5 py-1.5";
const inputCls =
  "w-full min-w-0 rounded-md border border-primary/40 bg-card px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/25";

export function EditRateRow({ initialRate, onSave, onCancel, colSpanBefore }: EditRateRowProps) {
  const [map, setMap] = useState(initialRate?.mealPlans.MAP != null ? String(initialRate.mealPlans.MAP) : "");
  const [cp, setCp] = useState(initialRate?.mealPlans.CP != null ? String(initialRate.mealPlans.CP) : "");
  const [extraBed, setExtraBed] = useState(initialRate?.extraBed != null ? String(initialRate.extraBed) : "");
  const [validTo, setValidTo] = useState(initialRate?.validTo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parseMoney(v: string): number | null | "invalid" {
    if (v.trim() === "") return null;
    const n = Number(v);
    if (Number.isNaN(n) || n < 0) return "invalid";
    return n;
  }

  async function handleSave() {
    const mapNet = parseMoney(map);
    const cpNet = parseMoney(cp);
    const extraBedNet = parseMoney(extraBed);
    if (mapNet === "invalid" || cpNet === "invalid" || extraBedNet === "invalid") {
      setError("Rates must be valid non-negative numbers.");
      return;
    }
    setError(null);
    setSaving(true);
    const ok = await onSave({
      validTo: validTo || null,
      mealPlans: { MAP: mapNet, CP: cpNet, AP: initialRate?.mealPlans.AP ?? null },
      extraBed: extraBedNet,
    });
    setSaving(false);
    if (!ok) setError("Save failed — please try again.");
  }

  return (
    <tr className="bg-primary/5">
      <td colSpan={colSpanBefore} className="px-3 py-1.5 text-xs text-muted-foreground">
        {error}
      </td>
      <td className={cellCls}>
        <input
          type="number"
          min={0}
          className={`${inputCls} text-right`}
          placeholder="MAP"
          value={map}
          onChange={(e) => setMap(e.target.value)}
          autoFocus
        />
      </td>
      <td className={cellCls}>
        <input
          type="number"
          min={0}
          className={`${inputCls} text-right`}
          placeholder="CP"
          value={cp}
          onChange={(e) => setCp(e.target.value)}
        />
      </td>
      <td className={cellCls}>
        <input
          type="number"
          min={0}
          className={`${inputCls} text-right`}
          placeholder="Extra bed"
          value={extraBed}
          onChange={(e) => setExtraBed(e.target.value)}
        />
      </td>
      <td className={cellCls}>
        <input type="date" className={inputCls} value={validTo} onChange={(e) => setValidTo(e.target.value)} />
      </td>
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            title="Save rate"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            title="Cancel"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
