"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, CalendarDays, Car, Phone, UserRound, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";
import type { TripCard } from "@/lib/trips/types";
import { ConfirmationBadge, fmtDay } from "./TripBits";

// "Tour starts tomorrow" celebration — shown to the trip's salesperson and to
// super admins (see getTripsStartingTomorrow), once per trip per browser.
// Trips that still have no driver after locking are left to DriverDueGate
// (which blocks until the driver is added); once it is, the next navigation
// celebrates the trip here — so the two dialogs never stack.
const SEEN_KEY = "vkh-trip-celebrated";
const SKIP_PATHS = ["/admin/mfa", "/admin/profile"];

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function markSeen(keys: string[]) {
  try {
    // Keep only recent entries — keys embed the start date, so old ones are inert.
    const next = [...new Set([...readSeen(), ...keys])].slice(-200);
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the dialog just may show again next visit */
  }
}

const seenKey = (t: TripCard) => `${t.id}:${t.startDate}`;

async function celebrate() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#1d5c43", "#6abf8e", "#f5c542", "#ff7a59", "#ffffff"];
  const end = Date.now() + 1800;
  // Side cannons…
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors, zIndex: 9999 });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors, zIndex: 9999 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  // …and a few firework bursts.
  [250, 700, 1150].forEach((delay, i) =>
    setTimeout(
      () =>
        confetti({
          particleCount: 90,
          spread: 100,
          startVelocity: 38,
          origin: { x: [0.3, 0.7, 0.5][i], y: 0.35 },
          colors,
          shapes: ["circle", "square", "star"],
          zIndex: 9999,
        }),
      delay,
    ),
  );
}

export function TripCelebrationGate() {
  const pathname = usePathname();
  const [trips, setTrips] = useState<TripCard[]>([]);
  const fired = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trips/starting-tomorrow", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { trips: [] }))
      .then((json: { trips?: TripCard[] }) => {
        if (cancelled) return;
        const seen = readSeen();
        setTrips(
          (json.trips ?? []).filter(
            // A locked trip without a driver belongs to DriverDueGate first.
            (t) => !seen.has(seenKey(t)) && !(t.servicesLocked && !t.driver),
          ),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const open = trips.length > 0 && !SKIP_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (open && !fired.current) {
      fired.current = true;
      void celebrate();
    }
    if (!open) fired.current = false;
  }, [open]);

  function close() {
    markSeen(trips.map(seenKey));
    setTrips([]);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-0">
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-[#1d5c43] via-[#22704f] to-[#6abf8e] px-6 pb-5 pt-6 text-white">
          <div aria-hidden className="pointer-events-none absolute -right-4 -top-3 text-6xl opacity-90">
            🎉
          </div>
          <div aria-hidden className="pointer-events-none absolute bottom-1 right-16 text-3xl">
            🎊
          </div>
          <DialogHeader>
            <DialogTitle className="text-left font-display text-2xl font-extrabold text-white">
              {trips.length === 1 ? "A tour starts tomorrow!" : `${trips.length} tours start tomorrow!`} 😊
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-white/85">
            Great work getting {trips.length === 1 ? "this trip" : "these trips"} over the line. Here’s the
            summary — wish your guests a wonderful journey!
          </p>
        </div>

        <div className="space-y-3 p-5">
          {trips.map((t) => (
            <div key={t.id} className="rounded-xl border border-border p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-foreground">{t.guestName}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.tourTitle ?? "Custom package"} · Ref {t.ref}
                  </p>
                </div>
                <a
                  href={`tel:${t.guestPhone}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/15"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" /> {fmtDay(t.startDate)} → {fmtDay(t.endDate)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {t.travellers} traveller{t.travellers === 1 ? "" : "s"}
                </span>
                {t.assignee && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" /> {t.assignee.name}
                  </span>
                )}
              </div>

              {t.hotels.length > 0 && (
                <ul className="mt-2.5 space-y-1">
                  {t.hotels.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate text-foreground">
                        <BedDouble className="mr-1 inline h-3.5 w-3.5 text-primary" />
                        {h.name}
                        <span className="text-muted-foreground"> · {fmtDay(h.checkIn)} → {fmtDay(h.checkOut)}</span>
                      </span>
                      <ConfirmationBadge status={h.confirmation} />
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-2.5 flex items-center gap-1.5 text-xs">
                <Car className="h-3.5 w-3.5 text-primary" />
                {t.driver ? (
                  <span className="text-foreground">
                    {t.driver.name}
                    {t.driver.phone ? ` · ${t.driver.phone}` : ""}
                    {t.driver.vehicle ? ` · ${t.driver.vehicle}` : ""}
                    {t.driver.number ? ` (${t.driver.number})` : ""}
                  </span>
                ) : (
                  <span className="font-bold text-red-600 dark:text-red-400">No driver assigned yet</span>
                )}
              </p>

              <Link
                href={`/admin/bookings/${t.id}/services`}
                onClick={close}
                className="mt-3 inline-flex text-xs font-bold text-primary hover:underline"
              >
                Open booking →
              </Link>
            </div>
          ))}

          <button
            onClick={close}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            Yay! Got it 🎉
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
