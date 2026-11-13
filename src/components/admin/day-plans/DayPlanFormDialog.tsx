"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";
import {
  DAY_PLAN_PLACES,
  DAY_PLAN_SEASONS,
  SEASON_LABELS,
  type DayPlanInput,
  type DayPlanSeasonValue,
} from "@/lib/dayPlans/schema";

const PLACES_LIST_ID = "day-plan-places";
const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25";
const labelCls = "mb-1 block text-[12px] font-semibold text-muted-foreground";

export const EMPTY_DAY_PLAN: DayPlanInput = {
  fromPlace: "",
  toPlace: "",
  title: "",
  body: "",
  season: "ALL_YEAR",
  isActive: true,
  sortOrder: 0,
};

/**
 * Add / edit one day plan. `planId` set = edit (PATCH), otherwise create (POST)
 * — also used by a proposal day's "Save to library" with the day prefilled.
 */
export function DayPlanFormDialog({
  open,
  onOpenChange,
  planId,
  initial,
  onSaved,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: string;
  initial: DayPlanInput;
  onSaved: () => void;
  title?: string;
}) {
  const [form, setForm] = useState<DayPlanInput>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof DayPlanInput>(k: K, v: DayPlanInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.fromPlace.trim() || !form.toPlace.trim() || !form.title.trim() || !form.body.trim()) {
      toast.error("From, To, Title and Description are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(planId ? `/api/day-plans/${planId}` : "/api/day-plans", {
        method: planId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 403) {
        toast.error("You don't have permission to change the day plan library.");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success(planId ? "Day plan updated." : "Day plan added to the library.");
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Could not save the day plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="flex-col items-start">
          <DialogTitle>{title ?? (planId ? "Edit day plan" : "New day plan")}</DialogTitle>
        </DialogHeader>

        <datalist id={PLACES_LIST_ID}>
          {DAY_PLAN_PLACES.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>From</label>
            <input list={PLACES_LIST_ID} value={form.fromPlace} onChange={(e) => set("fromPlace", e.target.value)} className={inputCls} placeholder="Srinagar" />
          </div>
          <div>
            <label className={labelCls}>To (same place = local day)</label>
            <input list={PLACES_LIST_ID} value={form.toPlace} onChange={(e) => set("toPlace", e.target.value)} className={inputCls} placeholder="Gulmarg" />
          </div>
          <div>
            <label className={labelCls}>Season</label>
            <select value={form.season} onChange={(e) => set("season", e.target.value as DayPlanSeasonValue)} className={inputCls}>
              {DAY_PLAN_SEASONS.map((s) => (
                <option key={s} value={s}>
                  {SEASON_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Day heading (shown in the proposal)</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="Srinagar to Gulmarg — Meadow of Flowers" />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={7} className={inputCls} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Active (shown in the picker)
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
