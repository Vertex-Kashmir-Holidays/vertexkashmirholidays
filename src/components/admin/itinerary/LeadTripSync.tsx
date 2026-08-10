"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Link2, Loader2 } from "lucide-react";
import type { LeadItinerarySeed } from "@/lib/itinerary/lead-defaults";

const CATEGORIES: [string, string][] = [
  ["", "— Category —"],
  ["HONEYMOON_TOUR", "Honeymoon"],
  ["COUPLE", "Couple"],
  ["FAMILY_TOUR", "Family"],
  ["GROUP_TOUR", "Group"],
  ["SKI_TOUR", "Ski"],
  ["OFFBEAT_TOUR", "Offbeat"],
];

interface TripState {
  name: string;
  category: string;
  adults: string;
  children: string;
  start: string;
  end: string;
}

interface Props {
  leadId: string;
  initial: {
    name: string;
    category: string | null;
    adults: number;
    children: number | null;
    startDate: string;
    endDate: string;
  };
  /** Push recomputed lead facts into the itinerary document (live cover update). */
  onFacts: (facts: LeadItinerarySeed) => void;
}

const inputCls =
  "w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";

/**
 * Trip-detail controls for a lead-linked itinerary. Editing here updates the
 * lead (source of truth) AND recomputes the itinerary's cover/duration live —
 * the reverse direction of the server-side lead→itinerary sync.
 */
export function LeadTripSync({ leadId, initial, onFacts }: Props) {
  const [isPending, startTransition] = useTransition();
  const [trip, setTrip] = useState<TripState>({
    name: initial.name,
    category: initial.category ?? "",
    adults: String(initial.adults),
    children: initial.children != null ? String(initial.children) : "",
    start: initial.startDate,
    end: initial.endDate,
  });

  function toFacts(t: TripState): LeadItinerarySeed {
    return {
      name: t.name,
      category: t.category || null,
      adults: parseInt(t.adults, 10) || 1,
      children: t.children === "" ? null : parseInt(t.children, 10) || 0,
      startDate: t.start ? new Date(t.start) : null,
      endDate: t.end ? new Date(t.end) : null,
    };
  }

  function apply(next: TripState, persist: boolean) {
    onFacts(toFacts(next));
    if (!persist) return;
    const f = toFacts(next);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: next.name,
            category: f.category,
            adults: f.adults,
            children: f.children,
            startDate: next.start || null,
            endDate: next.end || null,
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: unknown };
          toast.error(typeof j.error === "string" ? j.error : "Failed to sync with lead.");
          return;
        }
        toast.success("Synced with lead.");
      } catch {
        toast.error("Failed to sync with lead.");
      }
    });
  }

  function set(field: keyof TripState, value: string, persist: boolean) {
    const next = { ...trip, [field]: value };
    setTrip(next);
    apply(next, persist);
  }

  return (
    <div className="no-print rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Trip details — synced with lead</h3>
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      <p className="mb-3 text-[12px] text-muted-foreground">
        Editing these updates the lead and recalculates the cover dates, duration and travellers.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="col-span-2 sm:col-span-1 block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Name</span>
          <input
            value={trip.name}
            readOnly
            onClick={() =>
              toast.warning(
                "This itinerary is already linked to a lead — the customer name can't be changed here.",
              )
            }
            className={`${inputCls} cursor-not-allowed`}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">
            Start date
          </span>
          <input
            type="date"
            value={trip.start}
            onChange={(e) => set("start", e.target.value, true)}
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">
            End date
          </span>
          <input
            type="date"
            value={trip.end}
            onChange={(e) => set("end", e.target.value, true)}
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Adults</span>
          <input
            type="number"
            min={1}
            value={trip.adults}
            onChange={(e) => set("adults", e.target.value, false)}
            onBlur={() => apply(trip, true)}
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">
            Children
          </span>
          <input
            type="number"
            min={0}
            value={trip.children}
            onChange={(e) => set("children", e.target.value, false)}
            onBlur={() => apply(trip, true)}
            className={inputCls}
          />
        </label>

        <label className="relative block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">
            Category
          </span>
          <select
            value={trip.category}
            onChange={(e) => set("category", e.target.value, true)}
            className={`${inputCls} appearance-none pr-7`}
          >
            {CATEGORIES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-[30px] h-3.5 w-3.5 text-muted-foreground" />
        </label>
      </div>
    </div>
  );
}

interface LinkableLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}
interface LinkableBooking {
  id: string;
  name: string;
  email: string | null;
  ref: string;
}

/**
 * Shown in place of LeadTripSync for a standalone (unlinked) itinerary — lets
 * staff attach it to an existing lead or direct booking that doesn't already
 * have one. Once linked, the page refresh switches this editor over to the
 * synced (lead) or locked-name (booking) view.
 */
export function LinkItineraryPanel({ itineraryId }: { itineraryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LinkableLead[]>([]);
  const [bookings, setBookings] = useState<LinkableBooking[]>([]);
  const [selected, setSelected] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetch("/api/itineraries/linkable")
      .then((res) => res.json())
      .then((j: { leads?: LinkableLead[]; bookings?: LinkableBooking[] }) => {
        setLeads(j.leads ?? []);
        setBookings(j.bookings ?? []);
      })
      .catch(() => toast.error("Failed to load leads/bookings."))
      .finally(() => setLoading(false));
  }, []);

  function link() {
    if (!selected) return;
    const [type, targetId] = selected.split(":");
    setLinking(true);
    fetch(`/api/itineraries/${itineraryId}/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id: targetId }),
    })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(j.error ?? "Failed to link.");
        toast.success("Itinerary linked.");
        router.refresh();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to link."))
      .finally(() => setLinking(false));
  }

  const noOptions = !loading && leads.length === 0 && bookings.length === 0;

  return (
    <div className="no-print rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Link to a lead or booking</h3>
      </div>
      <p className="mb-3 text-[12px] text-muted-foreground">
        This itinerary isn&apos;t linked yet. Link it to a lead or booking that doesn&apos;t already
        have one — the customer name and trip details will then stay in sync with it.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={loading || noOptions}
          className={`${inputCls} flex-1 appearance-none`}
        >
          <option value="">
            {loading ? "Loading…" : noOptions ? "No unlinked leads or bookings" : "— Select —"}
          </option>
          {leads.length > 0 && (
            <optgroup label="Leads">
              {leads.map((l) => (
                <option key={`lead:${l.id}`} value={`lead:${l.id}`}>
                  {l.name} · {l.phone}
                </option>
              ))}
            </optgroup>
          )}
          {bookings.length > 0 && (
            <optgroup label="Bookings">
              {bookings.map((b) => (
                <option key={`booking:${b.id}`} value={`booking:${b.id}`}>
                  {b.name} · #{b.ref}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <button
          type="button"
          onClick={link}
          disabled={!selected || linking}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {linking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Link
        </button>
      </div>
    </div>
  );
}
