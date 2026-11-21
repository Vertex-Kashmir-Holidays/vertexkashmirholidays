// Small presentational pieces shared by the Trips board and Hotel stays view.
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CONFIRMATION_LABELS, type HotelConfirmationStatus } from "@/lib/trips/types";

/** "YYYY-MM-DD" → "Fri, 12 Dec" (calendar day, never timezone-shifted). */
export function fmtDay(ymd: string | null, withYear = false): string {
  if (!ymd) return "—";
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

const CONFIRMATION_STYLES: Record<HotelConfirmationStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  REQUESTED: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  CONFIRMED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  CANCELLED: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export function ConfirmationBadge({ status }: { status: HotelConfirmationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold",
        CONFIRMATION_STYLES[status],
      )}
    >
      {CONFIRMATION_LABELS[status]}
    </span>
  );
}

/** Trips board / Hotel stays tab switch. */
export function TripsTabs({ active }: { active: "trips" | "hotels" }) {
  const tabs = [
    { key: "trips", href: "/admin/trips", label: "Upcoming Trips" },
    { key: "hotels", href: "/admin/trips/hotels", label: "Hotel Stays" },
  ] as const;
  return (
    <div className="inline-flex rounded-xl border border-border bg-card p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
            active === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
