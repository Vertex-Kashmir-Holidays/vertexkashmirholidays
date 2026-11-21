"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Copy, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminSearchInput } from "@/components/ui/molecules/admin-search-input";
import { Button } from "@/components/ui/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";
import { cn } from "@/lib/utils";
import {
  SEASON_LABELS,
  routeLabel,
  type DayPlanInput,
  type DayPlanRecord,
  type DayPlanSeasonValue,
} from "@/lib/dayPlans/schema";
import { DayPlanFormDialog, EMPTY_DAY_PLAN } from "./DayPlanFormDialog";

const routeKey = (p: { fromPlace: string; toPlace: string }) =>
  `${p.fromPlace.trim().toLowerCase()}|${p.toPlace.trim().toLowerCase()}`;

type Editing = { id?: string; initial: DayPlanInput; title?: string } | null;

export function DayPlansLibrary({
  plans,
  canCreate,
  canEdit,
  canDelete,
}: {
  plans: DayPlanRecord[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [season, setSeason] = useState<"ANY" | DayPlanSeasonValue>("ANY");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<DayPlanRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const m = new Map<string, { label: string; items: DayPlanRecord[] }>();
    for (const p of plans) {
      if (!showInactive && !p.isActive) continue;
      if (season !== "ANY" && p.season !== season) continue;
      if (needle && !`${p.fromPlace} ${p.toPlace} ${p.title} ${p.body}`.toLowerCase().includes(needle))
        continue;
      const k = routeKey(p);
      const g = m.get(k) ?? { label: routeLabel(p), items: [] };
      g.items.push(p);
      m.set(k, g);
    }
    return [...m.values()];
  }, [plans, q, season, showInactive]);

  const toInput = (p: DayPlanRecord): DayPlanInput => ({
    fromPlace: p.fromPlace,
    toPlace: p.toPlace,
    title: p.title,
    body: p.body,
    season: p.season,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  });

  async function toggleActive(p: DayPlanRecord) {
    const res = await fetch(`/api/day-plans/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (!res.ok) return toast.error("Could not update the day plan.");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/day-plans/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Day plan deleted.");
      setDeleting(null);
      router.refresh();
    } catch {
      toast.error("Could not delete the day plan.");
    } finally {
      setBusy(false);
    }
  }

  const total = plans.filter((p) => p.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">Destinations Library</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ready-written day headings & descriptions per route — {total} active plans. Pick them into a proposal&apos;s days with
            “Pick from library”.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setEditing({ initial: EMPTY_DAY_PLAN })}>
            <Plus className="mr-1.5 h-4 w-4" /> New day plan
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <AdminSearchInput value={q} onChange={setQ} placeholder="Search route, title or activity…" />
        </div>
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value as "ANY" | DayPlanSeasonValue)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          aria-label="Season"
        >
          <option value="ANY">All seasons</option>
          <option value="ALL_YEAR">All year</option>
          <option value="SUMMER">Summer</option>
          <option value="WINTER">Winter</option>
        </select>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No day plans match.
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.label}>
            <div className="mb-2 flex items-baseline gap-2">
              <h3 className="font-display text-base font-bold text-foreground">{g.label}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {g.items.length}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {g.items.map((p) => (
                <article
                  key={p.id}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
                    !p.isActive && "opacity-60",
                  )}
                >
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-bold",
                          p.season === "WINTER"
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                            : p.season === "SUMMER"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {SEASON_LABELS[p.season]}
                      </span>
                      {!p.isActive && (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-bold text-muted-foreground">Inactive</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-foreground">{p.title}</p>
                    <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
                    {(canEdit || canCreate || canDelete) && (
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                        {canEdit && (
                          <button
                            onClick={() => setEditing({ id: p.id, initial: toInput(p) })}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        )}
                        {canCreate && (
                          <button
                            onClick={() =>
                              setEditing({ initial: { ...toInput(p), title: `${p.title} (copy)` }, title: "Duplicate day plan" })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-muted"
                          >
                            <Copy className="h-3 w-3" /> Duplicate
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => toggleActive(p)}
                            className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-muted"
                          >
                            {p.isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleting(p)}
                            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-500/10 dark:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      {editing && (
        <DayPlanFormDialog
          key={editing.id ?? editing.initial.title}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          planId={editing.id}
          initial={editing.initial}
          title={editing.title}
          onSaved={() => router.refresh()}
        />
      )}

      <Dialog open={!!deleting} onOpenChange={(o) => !busy && !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex-col items-start gap-2 pr-6">
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" /> Delete this day plan?
            </DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be removed from the library. Proposals that already used it keep their
              copy. This can’t be undone — use Deactivate to just hide it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} disabled={busy} className="bg-red-600 text-white hover:bg-red-700">
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
