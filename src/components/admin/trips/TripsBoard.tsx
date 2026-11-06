"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BedDouble,
  CalendarDays,
  Car,
  CheckCircle2,
  Mail,
  Phone,
  Plane,
  UserRound,
} from "lucide-react";
import { AdminSearchInput } from "@/components/ui/molecules/admin-search-input";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { cn } from "@/lib/utils";
import { TRIP_BUCKETS, type TripBucket, type TripCard } from "@/lib/trips/types";
import { ConfirmationBadge, TripsTabs, fmtDay } from "./TripBits";

type Flag = "all" | "unconfirmed" | "noDriver";

export function TripsBoard({ trips, showAssignee }: { trips: TripCard[]; showAssignee: boolean }) {
  const [q, setQ] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [flag, setFlag] = useState<Flag>("all");
  const [showCompleted, setShowCompleted] = useState(false);

  const assignees = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of trips) if (t.assignee) m.set(t.assignee.id, t.assignee.name);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [trips]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return trips.filter((t) => {
      if (assignee !== "all" && t.assignee?.id !== assignee) return false;
      if (flag === "unconfirmed" && t.unconfirmedHotels === 0) return false;
      if (flag === "noDriver" && (t.driver || t.bucket === "completed")) return false;
      if (!needle) return true;
      return [t.guestName, t.guestPhone, t.guestEmail ?? "", t.ref, ...t.hotels.map((h) => h.name)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [trips, q, assignee, flag]);

  const active = trips.filter((t) => t.bucket !== "completed");
  const stats = {
    tomorrow: trips.filter((t) => t.bucket === "tomorrow").length,
    onTour: trips.filter((t) => t.bucket === "onTour").length,
    unconfirmed: active.reduce((n, t) => n + t.unconfirmedHotels, 0),
    noDriver: active.filter((t) => !t.driver).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">Upcoming Trips</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every upcoming and running tour — guests, hotels, confirmations and drivers at a glance.
          </p>
        </div>
        <TripsTabs active="trips" />
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard size="sm" label="Starting tomorrow" value={stats.tomorrow} icon={Plane} accent="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
        <StatCard size="sm" label="On tour now" value={stats.onTour} icon={CalendarDays} accent="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <StatCard size="sm" label="Hotels not confirmed" value={stats.unconfirmed} icon={BedDouble} accent="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <StatCard size="sm" label="Trips without driver" value={stats.noDriver} icon={Car} accent="bg-red-500/10 text-red-600 dark:text-red-400" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <AdminSearchInput value={q} onChange={setQ} placeholder="Search guest, phone, email, ref or hotel…" />
        </div>
        {showAssignee && assignees.length > 0 && (
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            aria-label="Filter by salesperson"
          >
            <option value="all">All salespeople</option>
            {assignees.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
        <div className="inline-flex rounded-lg border border-border p-0.5 text-xs font-bold">
          {(
            [
              ["all", "All"],
              ["unconfirmed", "Hotels pending"],
              ["noDriver", "No driver"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFlag(k)}
              className={cn(
                "rounded-md px-2.5 py-1.5 transition",
                flag === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {TRIP_BUCKETS.filter((b) => b.key !== "completed" || showCompleted).map((bucket) => {
        const items = filtered.filter((t) => t.bucket === bucket.key);
        if (items.length === 0) return null;
        return (
          <section key={bucket.key}>
            <div className="mb-2.5 flex items-baseline gap-2">
              <h3 className="font-display text-base font-bold text-foreground">{bucket.label}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {items.length}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">· {bucket.hint}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((t) => (
                <TripCardView key={t.id} trip={t} bucket={bucket.key} />
              ))}
            </div>
          </section>
        );
      })}

      {filtered.filter((t) => showCompleted || t.bucket !== "completed").length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No trips match these filters.
        </div>
      )}

      {trips.some((t) => t.bucket === "completed") && (
        <button
          onClick={() => setShowCompleted((v) => !v)}
          className="text-xs font-bold text-primary hover:underline"
        >
          {showCompleted ? "Hide" : "Show"} recently completed trips
        </button>
      )}
    </div>
  );
}

const BUCKET_ACCENT: Record<TripBucket, string> = {
  tomorrow: "bg-violet-500",
  onTour: "bg-blue-500",
  thisWeek: "bg-emerald-500",
  upcoming: "bg-slate-400",
  completed: "bg-muted-foreground/40",
};

const DAY_MS = 86_400_000;
const dayDiff = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

/** "Starts tomorrow" / "In 5 days" / "Day 2 of 6" / "Ended 3 days ago". */
function timing(t: TripCard): string {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const toStart = dayDiff(today, t.startDate);
  if (toStart === 1) return "Starts tomorrow";
  if (toStart > 1) return `In ${toStart} days`;
  const end = t.endDate ?? t.startDate;
  if (end < today) {
    const ago = dayDiff(end, today);
    return `Ended ${ago} day${ago === 1 ? "" : "s"} ago`;
  }
  const total = dayDiff(t.startDate, end) + 1;
  return `Day ${-toStart + 1} of ${total}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{children}</p>;
}

function TripCardView({ trip: t, bucket }: { trip: TripCard; bucket: TripBucket }) {
  const ended = bucket === "completed";
  const nights = t.hotels.reduce((n, h) => n + (h.nights ?? 0), 0);
  const activeHotels = t.hotels.filter((h) => h.confirmation !== "CANCELLED");
  const confirmed = activeHotels.length - t.unconfirmedHotels;
  const allSet = !ended && t.unconfirmedHotels === 0 && !!t.driver && activeHotels.length > 0;
  const muted = "text-foreground/55";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md",
        ended && "opacity-75",
      )}
    >
      {/* Whole card opens the booking; contact links sit above this overlay. */}
      <Link
        href={`/admin/bookings/${t.id}/services`}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={`Open booking ${t.ref} for ${t.guestName}`}
      />

      {/* Header */}
      <div className="px-4 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", BUCKET_ACCENT[bucket])} aria-hidden />
            <p className="truncate text-[15px] font-semibold text-foreground group-hover:text-primary">
              {t.guestName}
            </p>
            {t.isB2b && (
              <span className="shrink-0 rounded bg-purple-500/15 px-1.5 py-px text-[10px] font-bold text-purple-700 dark:text-purple-300">
                B2B
              </span>
            )}
          </div>
          <span className="shrink-0 text-xs font-semibold text-foreground/80">{timing(t)}</span>
        </div>
        <p className={cn("mt-0.5 text-[11px]", muted)}>
          {t.tourTitle ?? "Custom package"} · Ref {t.ref}
        </p>
        {/* Trip facts — spelled out, one labelled item each. */}
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Starts", value: fmtDay(t.startDate, true) },
            { label: "Ends", value: t.endDate ? fmtDay(t.endDate, true) : "—" },
            {
              label: "Duration",
              value: nights > 0 ? `${nights} night${nights === 1 ? "" : "s"} / ${nights + 1} days` : "—",
            },
            { label: "Travellers", value: `${t.travellers} ${t.travellers === 1 ? "person" : "people"}` },
          ].map((f) => (
            <div key={f.label} className="rounded-lg bg-muted/40 px-2.5 py-1.5">
              <dt className={cn("text-[10px] font-semibold uppercase tracking-wide", muted)}>{f.label}</dt>
              <dd className="mt-0.5 text-xs font-semibold text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className={cn("relative z-10 mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs", muted)}>
          <a href={`tel:${t.guestPhone}`} className="inline-flex items-center gap-1 hover:text-primary">
            <Phone className="h-3 w-3" /> {t.guestPhone}
          </a>
          {t.guestEmail && (
            <a href={`mailto:${t.guestEmail}`} className="inline-flex min-w-0 items-center gap-1 hover:text-primary">
              <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{t.guestEmail}</span>
            </a>
          )}
        </div>
      </div>

      {/* Hotels */}
      <div className="mt-3 border-t border-border px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>Hotels</SectionLabel>
          {activeHotels.length > 0 && (
            <span
              className={cn(
                "text-[11px] font-bold",
                t.unconfirmedHotels === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
              )}
            >
              {confirmed}/{activeHotels.length} confirmed
            </span>
          )}
        </div>
        {t.hotels.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hotels added yet.</p>
        ) : (
          <ul className="space-y-2">
            {t.hotels.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-foreground">{h.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[
                      h.location,
                      h.checkIn || h.checkOut ? `${fmtDay(h.checkIn)} → ${fmtDay(h.checkOut)}` : "Dates not set",
                      h.rooms ? `${h.rooms} room${h.rooms === 1 ? "" : "s"}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <ConfirmationBadge status={h.confirmation} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Team */}
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-border bg-muted/20 px-4 py-3">
        <div className="min-w-0">
          <SectionLabel>Salesperson</SectionLabel>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-foreground">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{t.assignee ? t.assignee.name : t.isB2b ? "B2B request" : "Website booking"}</span>
          </p>
        </div>
        <div className="min-w-0">
          <SectionLabel>Driver</SectionLabel>
          {t.driver ? (
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-foreground">
              <Car className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {t.driver.name}
                {t.driver.number && <span className="font-normal text-muted-foreground"> · {t.driver.number}</span>}
              </span>
            </p>
          ) : ended ? (
            <p className="mt-1 text-xs text-muted-foreground">—</p>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Not assigned
            </p>
          )}
        </div>
      </div>

      {(allSet || !t.servicesLocked) && !ended && (
        <p
          className={cn(
            "flex items-center gap-1.5 border-t px-4 py-1.5 text-[11px] font-semibold",
            allSet
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          )}
        >
          {allSet ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> Ready to go
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" /> Services not locked yet
            </>
          )}
        </p>
      )}
    </article>
  );
}
