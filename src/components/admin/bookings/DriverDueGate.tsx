"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";
import type { DriverDueBooking } from "@/lib/bookings/driver";

// Blocking reminder: while any booking the staff member can see starts
// tomorrow or today without driver details (see driverDueTravelDateRange),
// every admin page is covered by this modal — no close button, Esc or
// outside click. The only way past it is the CTA to that booking's Services
// page (where the Add Driver form opens automatically) — the gate steps
// aside there so the form can be filled. Re-checked on every navigation, so
// it clears once the driver is saved.
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
  const open = due.length > 0 && !onDuePage && !exempt;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        hideClose
        className="max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" /> Driver details needed
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {due.length === 1 ? "This trip starts" : "These trips start"} within a day and no driver
          has been assigned. Add the driver &amp; vehicle before continuing.
        </p>
        <ul className="mt-2 space-y-2">
          {due.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{b.guestName}</p>
                <p className="text-xs text-muted-foreground">
                  {travelDayLabel(b.travelDate)}
                  {!b.servicesLocked && " · lock services first"}
                </p>
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
