"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";
import { cn } from "@/lib/utils";
import {
  SEASON_LABELS,
  routeLabel,
  type DayPlanRecord,
  type DayPlanSeasonValue,
} from "@/lib/dayPlans/schema";

type SeasonFilter = "ANY" | Exclude<DayPlanSeasonValue, "ALL_YEAR">;

const routeKey = (p: { fromPlace: string; toPlace: string }) =>
  `${p.fromPlace.trim().toLowerCase()}|${p.toPlace.trim().toLowerCase()}`;

/**
 * "Pick from library" for one proposal day: choose a route, see its ready-
 * written versions, and use one — the caller copies it into the day.
 */
export function DayPlanPicker({
  open,
  onOpenChange,
  onPick,
  dayNumber,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (plan: DayPlanRecord) => void;
  dayNumber: number;
}) {
  const [plans, setPlans] = useState<DayPlanRecord[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [route, setRoute] = useState<string | null>(null);
  const [season, setSeason] = useState<SeasonFilter>("ANY");

  useEffect(() => {
    if (!open || plans) return;
    let cancelled = false;
    fetch("/api/day-plans", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { plans: DayPlanRecord[] }) => !cancelled && setPlans(j.plans))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [open, plans]);

  // Routes, in library order, with how many versions each has.
  const routes = useMemo(() => {
    const m = new Map<string, { label: string; count: number }>();
    for (const p of plans ?? []) {
      const k = routeKey(p);
      const cur = m.get(k);
      m.set(k, { label: cur?.label ?? routeLabel(p), count: (cur?.count ?? 0) + 1 });
    }
    return [...m.entries()];
  }, [plans]);

  // Search ranks heading matches first, then route, then description; the
  // route list follows the search (routes that have a matching plan).
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const scored = (plans ?? [])
      .filter((p) => season === "ANY" || p.season === season || p.season === "ALL_YEAR")
      .map((p) => {
        if (!needle) return { p, score: 0 };
        const score = p.title.toLowerCase().includes(needle)
          ? 3
          : routeLabel(p).toLowerCase().includes(needle)
            ? 2
            : p.body.toLowerCase().includes(needle)
              ? 1
              : -1;
        return { p, score };
      })
      .filter((x) => x.score >= 0);
    return scored.sort((a, b) => b.score - a.score).map((x) => x.p);
  }, [plans, q, season]);

  const results = route ? matches.filter((p) => routeKey(p) === route) : matches;
  const matchingRoutes = new Set(matches.map(routeKey));
  const visibleRoutes = routes.filter(([k]) => matchingRoutes.has(k));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0">
        <div className="border-b border-border p-5 pb-4">
          <DialogHeader className="flex-col items-start gap-1">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Day {dayNumber} — pick from the library
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a route, then use one of its versions — only the day&apos;s heading and description are replaced; stay, meals, photo and date stay as they are.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search route, place or activity (e.g. Gulmarg, gondola)…"
                className="w-full rounded-xl border border-border bg-muted/50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div className="inline-flex rounded-lg border border-border p-0.5 text-xs font-bold">
              {(["ANY", "SUMMER", "WINTER"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 transition",
                    season === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s === "ANY" ? "Any season" : SEASON_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <p className="p-6 text-sm text-red-600">Could not load the day plan library.</p>
        ) : !plans ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">The library is empty — add day plans under Catalog → Destinations Library.</p>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[230px_1fr]">
            {/* Routes */}
            <div className="max-h-48 overflow-y-auto border-b border-border p-3 md:max-h-none md:border-b-0 md:border-r">
              <button
                onClick={() => setRoute(null)}
                className={cn(
                  "mb-1 w-full rounded-lg px-2.5 py-1.5 text-left text-sm font-semibold",
                  route === null ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                )}
              >
                All routes
              </button>
              {visibleRoutes.map(([k, r]) => (
                <button
                  key={k}
                  onClick={() => setRoute(k)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm",
                    route === k ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className="truncate">{r.label}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{r.count}</span>
                </button>
              ))}
            </div>

            {/* Versions */}
            <div className="overflow-y-auto p-3">
              {results.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No day plans match.</p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {results.map((p) => (
                    <div key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                      <div className="flex flex-1 flex-col p-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
                            {routeLabel(p)}
                          </span>
                          {p.season !== "ALL_YEAR" && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 font-bold",
                                p.season === "WINTER"
                                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                              )}
                            >
                              {SEASON_LABELS[p.season]}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm font-bold text-foreground">{p.title}</p>
                        <p className="mt-1 line-clamp-6 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
                        <button
                          onClick={() => {
                            onPick(p);
                            onOpenChange(false);
                          }}
                          className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110"
                        >
                          Use this heading & description
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
