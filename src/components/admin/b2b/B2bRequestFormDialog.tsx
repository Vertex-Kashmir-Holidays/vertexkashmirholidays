"use client";

// Shared B2B request form (guest, trip size, dates, budget, notes) — used to
// create a request for a known agent (NewB2bRequestForAgentButton) and to edit
// an existing one (EditB2bRequestButton), so the two can never drift apart.
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card";

export interface B2bRequestForm {
  guestName: string;
  guestPhone: string;
  days: string;
  pax: string;
  children: string;
  rooms: string;
  budget: string;
  startDate: string;
  endDate: string;
  notes: string;
}

export const EMPTY_B2B_REQUEST_FORM: B2bRequestForm = {
  guestName: "",
  guestPhone: "",
  days: "",
  pax: "",
  children: "",
  rooms: "",
  budget: "",
  startDate: "",
  endDate: "",
  notes: "",
};

/** Form → API body: blank optional fields are sent as undefined. */
export function b2bRequestPayload(form: B2bRequestForm) {
  return {
    guestName: form.guestName,
    guestPhone: form.guestPhone,
    days: form.days || undefined,
    pax: form.pax || undefined,
    children: form.children || undefined,
    rooms: form.rooms || undefined,
    budget: form.budget || undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    notes: form.notes || undefined,
  };
}

/** Pull the first readable message out of an API error response. */
export function b2bRequestError(data: { error?: unknown }, fallback: string): string {
  const err = data.error as { fieldErrors?: Record<string, string[]> } | string | undefined;
  if (typeof err === "string") return err;
  const flat = err?.fieldErrors ? Object.values(err.fieldErrors).flat()[0] : undefined;
  return flat ?? fallback;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  initial: B2bRequestForm;
  /** Resolves to an error message to show, or null on success. */
  onSubmit: (form: B2bRequestForm) => Promise<string | null>;
}

export function B2bRequestFormDialog({ open, onOpenChange, title, submitLabel, initial, onSubmit }: Props) {
  const [form, setForm] = useState<B2bRequestForm>(initial);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-seed each time the dialog opens (edit shows the request's current values).
  useEffect(() => {
    if (open) {
      setForm(initial);
      setFormError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      setFormError(await onSubmit(form));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[13px] font-semibold text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Guest Name *</label>
              <input
                required
                className={inputCls + " mt-1"}
                value={form.guestName}
                onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Guest Phone *</label>
              <input
                required
                className={inputCls + " mt-1"}
                placeholder="+91…"
                value={form.guestPhone}
                onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Days</label>
              <input
                type="number"
                min={1}
                className={inputCls + " mt-1"}
                value={form.days}
                onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Pax</label>
              <input
                type="number"
                min={1}
                className={inputCls + " mt-1"}
                value={form.pax}
                onChange={(e) => setForm((f) => ({ ...f, pax: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Children (5–12y)</label>
              <input
                type="number"
                min={0}
                className={inputCls + " mt-1"}
                value={form.children}
                onChange={(e) => setForm((f) => ({ ...f, children: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Rooms</label>
              <input
                type="number"
                min={1}
                className={inputCls + " mt-1"}
                value={form.rooms}
                onChange={(e) => setForm((f) => ({ ...f, rooms: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Budget (₹, min 20,000)</label>
              <input
                type="number"
                min={20000}
                step={1000}
                className={inputCls + " mt-1"}
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Planning From</label>
              <input
                type="date"
                className={inputCls + " mt-1"}
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    startDate: e.target.value,
                    endDate: f.endDate && f.endDate < e.target.value ? "" : f.endDate,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Planning To</label>
              <input
                type="date"
                min={form.startDate || undefined}
                disabled={!form.startDate}
                className={inputCls + " mt-1 disabled:cursor-not-allowed disabled:opacity-60"}
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-foreground">Other Requirements</label>
              <textarea
                className={inputCls + " mt-1"}
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
