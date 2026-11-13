"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";
import type { DriverDueBooking } from "@/lib/bookings/driver";

// Reminder: while any LOCKED booking the staff member can see starts tomorrow
// or today without driver details (see driverDueTravelDateRange), admin pages
// open this modal. Its CTA goes to that booking's Services page (where the Add
// Driver form opens automatically) — the gate steps aside there. It can be
// closed; a closed booking stays hidden until the page is reloaded (the admin
// layout keeps this component mounted across navigations). Re-checked on every
// navigation, so it clears once the driver is saved and reopens for any newly
// due booking.
const ALWAYS_REACHABLE = ["/admin/mfa", "/admin/profile"];

function travelDayLabel(iso: string): string {
  const date = new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const todayIst = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const travelIst = new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return travelIst <= todayIst ? `Today · ${date}` : `Tomorrow · ${date}`;
}

export function DriverDueGate() {
  const pathname = usePathname();
  const [due, setDue] = useState<DriverDueBooking[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bookings/driver-due", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { bookings: [] }))
      .then((json: { bookings?: DriverDueBooking[] }) => {
        if (!cancelled) setDue(json.bookings ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const onDuePage = due.some((b) => pathname.startsWith(`/admin/bookings/${b.id}/services`));
  const exempt = ALWAYS_REACHABLE.some((p) => pathname.startsWith(p));
  const shown = due.filter((b) => !dismissed.has(b.id));
  const open = shown.length > 0 && !onDuePage && !exempt;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setDismissed((prev) => new Set([...prev, ...shown.map((b) => b.id)]));
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" /> Driver details needed
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {shown.length === 1 ? "This trip starts" : "These trips start"} within a day and no driver
          has been assigned. Add the driver &amp; vehicle.
        </p>
        <ul className="mt-2 space-y-2">
          {shown.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{b.guestName}</p>
                <p className="text-xs text-muted-foreground">{travelDayLabel(b.travelDate)}</p>
              </div>
              <Link
                href={`/admin/bookings/${b.id}/services?addDriver=1`}
                className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:brightness-110"
              >
                Add driver details
              </Link>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
