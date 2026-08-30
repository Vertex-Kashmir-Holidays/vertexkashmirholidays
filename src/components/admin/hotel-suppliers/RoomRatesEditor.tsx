"use client";

// Editable room-type rate table — "Deluxe / Super Deluxe / Extra Bed" rows,
// each with its own EP/CP/MAP. Always starts with (and never drops below) one
// row; Add/Delete let it grow to match however many room types a given hotel
// actually quotes. Shared by the create-hotel form and the edit modal so the
// table never has two divergent implementations.
import { Plus, Trash2 } from "lucide-react";

export interface RoomRateRowDraft {
  roomType: string;
  ep: string;
  cp: string;
  map: string;
}

export const EMPTY_ROOM_RATE_ROW_DRAFT: RoomRateRowDraft = { roomType: "", ep: "", cp: "", map: "" };

interface RoomRatesEditorProps {
  rows: RoomRateRowDraft[];
  onChange: (rows: RoomRateRowDraft[]) => void;
}

const inputCls =
  "w-full px-2.5 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card";

export function RoomRatesEditor({ rows, onChange }: RoomRatesEditorProps) {
  function updateRow(index: number, field: keyof RoomRateRowDraft, value: string) {
    onChange(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    onChange([...rows, { ...EMPTY_ROOM_RATE_ROW_DRAFT }]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return; // always keep at least one row
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_88px_88px_88px_32px] gap-2 px-0.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
        <span>Room Type</span>
        <span>EP</span>
        <span>CP</span>
        <span>MAP</span>
        <span />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_88px_88px_88px_32px] gap-2 items-center">
          <input
            value={row.roomType}
            onChange={(e) => updateRow(i, "roomType", e.target.value)}
            placeholder="e.g. Deluxe"
            className={inputCls}
          />
          <input
            value={row.ep}
            onChange={(e) => updateRow(i, "ep", e.target.value)}
            placeholder="0"
            inputMode="decimal"
            className={`${inputCls} text-right`}
          />
          <input
            value={row.cp}
            onChange={(e) => updateRow(i, "cp", e.target.value)}
            placeholder="0"
            inputMode="decimal"
            className={`${inputCls} text-right`}
          />
          <input
            value={row.map}
            onChange={(e) => updateRow(i, "map", e.target.value)}
            placeholder="0"
            inputMode="decimal"
            className={`${inputCls} text-right`}
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            disabled={rows.length <= 1}
            title={rows.length <= 1 ? "At least one room type is required" : "Remove row"}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Room Type
      </button>
    </div>
  );
}
