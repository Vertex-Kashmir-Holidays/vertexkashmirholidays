"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BedDouble, Link2, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { AdminSearchInput } from "@/components/ui/molecules/admin-search-input";
import { cn } from "@/lib/utils";
import type { HotelStayGroup } from "@/lib/trips/types";
import { ConfirmationBadge, TripsTabs, fmtDay } from "./TripBits";

type Scope = "upcoming" | "recent" | "all";

export function HotelStaysView({ groups, allTime }: { groups: HotelStayGroup[]; allTime: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [scope, setScopeState] = useState<Scope>(allTime ? "all" : "upcoming");
  // "All time" needs older bookings than the default window → server reload.
  const setScope = (next: Scope) => {
    setScopeState(next);
    if ((next === "all") !== allTime) router.push(next === "all" ? "/admin/trips/hotels?range=all" : "/admin/trips/hotels");
  };

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        stays: g.stays.filter((s) => scope !== "upcoming" || s.bucket !== "completed"),
      }))
      .filter((g) => g.stays.length > 0)
      .filter(
        (g) =>
          !needle ||
          [g.name, g.destination ?? "", ...g.stays.map((s) => `${s.guestName} ${s.bookingRef}`)]
            .join(" ")
            .toLowerCase()
            .includes(needle),
      );
  }, [groups, q, scope]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">Hotel Stays</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every hotel we have booked guests into — dates, rooms and confirmation, ready to share with the hotel.
          </p>
        </div>
        <TripsTabs active="hotels" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <AdminSearchInput value={q} onChange={setQ} placeholder="Search hotel, destination or guest…" />
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5 text-xs font-bold">
          {(
            [
              ["upcoming", "Upcoming & on tour"],
              ["recent", "+ Last 30 days"],
              ["all", "All time"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setScope(k)}
              className={cn(
                "rounded-md px-2.5 py-1.5 transition",
                scope === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No hotel stays to show.
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((g) => (
            <section key={g.key} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <header className="flex flex-col gap-2 border-b border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                    <BedDouble className="h-4 w-4 text-primary" /> {g.name}
                    {g.linked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        <Link2 className="h-3 w-3" /> In hotel list
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                        Not linked
                      </span>
                    )}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {g.destination && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {g.destination}
                      </span>
                    )}
                    {g.contactPerson && (
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="h-3.5 w-3.5" /> {g.contactPerson}
                      </span>
                    )}
                    {g.phone && (
                      <a href={`tel:${g.phone}`} className="inline-flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3.5 w-3.5" /> {g.phone}
                      </a>
                    )}
                    {g.email && (
                      <a href={`mailto:${g.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                        <Mail className="h-3.5 w-3.5" /> {g.email}
                      </a>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold text-muted-foreground">
                  {g.stays.length} stay{g.stays.length === 1 ? "" : "s"}
                </span>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2 font-semibold">Guest</th>
                      <th className="px-4 py-2 font-semibold">Check-in</th>
                      <th className="px-4 py-2 font-semibold">Check-out</th>
                      <th className="px-4 py-2 font-semibold">Rooms</th>
                      <th className="px-4 py-2 font-semibold">Room type</th>
                      <th className="px-4 py-2 font-semibold">Confirmation</th>
                      <th className="px-4 py-2 font-semibold">Salesperson</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {g.stays.map((s) => (
                      <tr key={s.id} className={cn("hover:bg-muted/40", s.bucket === "completed" && "opacity-70")}>
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/admin/bookings/${s.bookingId}/services`}
                            className="font-semibold text-foreground hover:text-primary"
                          >
                            {s.guestName}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            {s.bookingRef} · {s.travellers} pax · {s.guestPhone}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">{fmtDay(s.checkIn, true)}</td>
                        <td className="whitespace-nowrap px-4 py-2.5">{fmtDay(s.checkOut, true)}</td>
                        <td className="px-4 py-2.5">{s.rooms ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{s.roomType ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <ConfirmationBadge status={s.confirmation} />
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{s.assigneeName ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
