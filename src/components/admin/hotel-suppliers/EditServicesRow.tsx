"use client";

// Services/amenities editor — appears inline under a hotel's row when Admin
// clicks "Edit services". One field, so unlike EditRateRow this doesn't align
// per-column; it's a single wide textarea spanning the row instead.
import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

interface EditServicesRowProps {
  initialServices: string | null;
  onSave: (services: string) => Promise<boolean>;
  onCancel: () => void;
  colSpanBefore: number;
}

export function EditServicesRow({
  initialServices,
  onSave,
  onCancel,
  colSpanBefore,
}: EditServicesRowProps) {
  const [draft, setDraft] = useState(initialServices ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(draft.trim());
    setSaving(false);
    if (!ok) return;
  }

  return (
    <tr className="bg-primary/5">
      <td colSpan={colSpanBefore} className="px-3 py-2 align-top">
        <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
          Services — one per line
        </label>
        <textarea
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={saving}
          autoFocus
          placeholder={"Central heating\nCentral A/C\nBuffet System"}
          className="w-full min-w-0 rounded-md border border-primary/40 bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/25"
        />
      </td>
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            title="Save services"
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
