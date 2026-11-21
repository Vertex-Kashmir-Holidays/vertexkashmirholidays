import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  IndianRupee,
  MapPin,
  Plane,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@prisma/client";
import { LEAD_STATUS_LABELS, LEAD_STATUS_STYLES } from "@/lib/leads/status";
import type { DashboardTrip, RecentBookingRow } from "@/lib/dashboard/data";
import type { getRecentLeads } from "@/lib/dashboard/data";
import type { PaymentStatus } from "@/lib/bookings/finance";
import { EmptyRow, PersonCell, tdCls, thCls } from "./parts";

const IST = "Asia/Kolkata";
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: IST });
/** Trip dates are calendar days stored at UTC midnight. */
const fmtTripDate = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const fmtWeekday = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const staffName = (u: { name: string | null; email: string } | null) => (u ? (u.name ?? u.email) : "—");
const leadService = (l: { packageName: string | null; tour: { title: string } | null }) =>
  l.tour?.title ?? l.packageName ?? "—";

/** Phones: each row becomes a stacked card instead of a sideways-scrolling table. */
function CardList({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-border md:hidden">{children}</ul>;
}

function CardItem({ href, person, aside, children }: { href: string; person: ReactNode; aside: ReactNode; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="block space-y-1.5 px-4 py-3 transition hover:bg-muted/50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">{person}</div>
          <div className="shrink-0">{aside}</div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[42px] text-[12px] text-muted-foreground">{children}</div>
      </Link>
    </li>
  );
}

/** Table shown from tablet width up (cards below). */
const tableWrap = "hidden overflow-x-auto md:block";
/** "Trip" column: hidden where its panel is half width (xl two-column row). */
const tripCol = "hidden md:table-cell xl:hidden 2xl:table-cell";

function LeadBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", LEAD_STATUS_STYLES[status])}>
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

// ── Alerts & reminders ───────────────────────────────────────────────────────

export type AlertKind =
  | "trip"
  | "upcoming"
  | "newLead"
  | "assigned"
  | "newBooking"
  | "confirmed"
  | "payment";

export interface Alert {
  key: string;
  title: string;
  detail: string;
  when: string;
  tone: "red" | "amber" | "blue" | "green" | "muted";
  href: string;
  kind: AlertKind;
}

const WHEN_TONES: Record<Alert["tone"], string> = {
  red: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  muted: "bg-muted text-muted-foreground",
};

const KIND_ICONS: Record<AlertKind, { Icon: LucideIcon; className: string }> = {
  trip: { Icon: Plane, className: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  upcoming: { Icon: CalendarDays, className: "bg-blue-500/15 text-blue-600 dark:text-blue-300" },
  newLead: { Icon: UserPlus, className: "bg-blue-500/15 text-blue-600 dark:text-blue-300" },
  assigned: { Icon: UserCheck, className: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
  newBooking: { Icon: CalendarPlus, className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  confirmed: { Icon: BadgeCheck, className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  payment: { Icon: IndianRupee, className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
};

function AlertRow({ a }: { a: Alert }) {
  const { Icon, className } = KIND_ICONS[a.kind];
  return (
    <li>
      <Link href={a.href} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-muted/50 sm:px-5">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", className)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-foreground">{a.title}</span>
          <span className="block truncate text-[12px] text-muted-foreground">{a.detail}</span>
        </span>
        <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold", WHEN_TONES[a.tone])}>
          {a.when}
        </span>
      </Link>
    </li>
  );
}

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="bg-muted/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground sm:px-5">
      {children}
    </p>
  );
}

/** To-do reminders first, then what happened recently. Scrolls inside the panel. */
export function AlertsList({ reminders, activity }: { reminders: Alert[]; activity: Alert[] }) {
  if (reminders.length === 0 && activity.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        <p className="text-xs text-muted-foreground">All caught up — nothing needs attention.</p>
      </div>
    );
  }
  return (
    <div className="max-h-[420px] overflow-y-auto">
      {reminders.length > 0 && (
        <>
          <GroupLabel>Needs attention</GroupLabel>
          <ul className="divide-y divide-border">
            {reminders.map((a) => (
              <AlertRow key={a.key} a={a} />
            ))}
          </ul>
        </>
      )}
      {activity.length > 0 && (
        <>
          <GroupLabel>Recent activity</GroupLabel>
          <ul className="divide-y divide-border">
            {activity.map((a) => (
              <AlertRow key={a.key} a={a} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ── Upcoming trips ───────────────────────────────────────────────────────────

function DaysLeft({ trip }: { trip: DashboardTrip }) {
  const label =
    trip.bucket === "onTour" ? "On tour" : trip.daysLeft === 0 ? "Today" : trip.daysLeft === 1 ? "Tomorrow" : trip.daysLeft;
  const tone =
    trip.bucket === "onTour"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : trip.daysLeft <= 1
        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
        : trip.daysLeft <= 7
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
          : "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  return (
    <span className={cn("inline-flex min-w-7 justify-center rounded-md px-2 py-0.5 text-[11px] font-bold", tone)}>
      {label}
    </span>
  );
}

function TaskBadge({ trip }: { trip: DashboardTrip }) {
  return trip.tasks.length === 0 ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
      <CheckCircle2 className="h-3 w-3" /> Clear
    </span>
  ) : (
    <span
      title={trip.tasks.map((x) => x.label).join(" · ")}
      className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-300"
    >
      <CalendarClock className="h-3 w-3" /> Pending {trip.tasks.length}
    </span>
  );
}

const tripPlace = (t: DashboardTrip) => t.tourTitle ?? t.hotels[0]?.location ?? "Kashmir";

export function TripsTable({ trips }: { trips: DashboardTrip[] }) {
  if (trips.length === 0) return <EmptyRow>No upcoming trips.</EmptyRow>;
  return (
    <>
    <CardList>
      {trips.map((t) => (
        <CardItem
          key={t.id}
          href={`/admin/bookings/${t.id}/services`}
          person={<PersonCell name={t.guestName} phone={t.guestPhone} />}
          aside={<DaysLeft trip={t} />}
        >
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{tripPlace(t)}</span>
          </span>
          <span className="whitespace-nowrap font-semibold text-foreground">
            {fmtTripDate(t.startDate)} · {fmtWeekday(t.startDate)}
          </span>
          {t.tasks.length === 0 ? (
            <TaskBadge trip={t} />
          ) : (
            t.tasks.map((x) => (
              <span
                key={x.label}
                className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-300"
              >
                {x.label}
              </span>
            ))
          )}
        </CardItem>
      ))}
    </CardList>
    <div className={tableWrap}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className={thCls}>Customer</th>
            <th className={thCls}>Trip</th>
            <th className={thCls}>Departure</th>
            <th className={thCls}>Days left</th>
            <th className={thCls}>Tasks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {trips.map((t) => (
            <tr key={t.id} className="transition hover:bg-muted/50">
              <td className={tdCls}>
                <Link href={`/admin/bookings/${t.id}/services`}>
                  <PersonCell name={t.guestName} phone={t.guestPhone} />
                </Link>
              </td>
              <td className={cn(tdCls, "max-w-[160px]")}>
                <span className="flex items-center gap-1 truncate text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{tripPlace(t)}</span>
                </span>
              </td>
              <td className={cn(tdCls, "whitespace-nowrap")}>
                <p className="font-semibold text-foreground">{fmtTripDate(t.startDate)}</p>
                <p className="text-[12px] text-muted-foreground">{fmtWeekday(t.startDate)}</p>
              </td>
              <td className={tdCls}>
                <DaysLeft trip={t} />
              </td>
              <td className={tdCls}>
                <TaskBadge trip={t} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

// ── Recent leads / bookings ──────────────────────────────────────────────────

export function RecentLeadsTable({
  rows,
  showAssignee,
}: {
  rows: Awaited<ReturnType<typeof getRecentLeads>>;
  showAssignee: boolean;
}) {
  if (rows.length === 0) return <EmptyRow>No leads yet.</EmptyRow>;
  return (
    <>
    <CardList>
      {rows.map((l) => (
        <CardItem
          key={l.id}
          href={`/admin/leads/${l.id}`}
          person={<PersonCell name={l.name} phone={l.phone} />}
          aside={<LeadBadge status={l.status} />}
        >
          <span className="min-w-0 truncate">{leadService(l)}</span>
          {showAssignee && <span className="text-foreground">{staffName(l.assignedTo)}</span>}
          <span className="whitespace-nowrap">{fmtDate(l.createdAt)}</span>
        </CardItem>
      ))}
    </CardList>
    <div className={tableWrap}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className={thCls}>Customer</th>
            <th className={cn(thCls, tripCol)}>Trip</th>
            <th className={thCls}>Status</th>
            {showAssignee && <th className={thCls}>Assigned to</th>}
            <th className={thCls}>Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((l) => (
            <tr key={l.id} className="transition hover:bg-muted/50">
              <td className={tdCls}>
                <Link href={`/admin/leads/${l.id}`}>
                  <PersonCell name={l.name} phone={l.phone} />
                </Link>
              </td>
              <td className={cn(tdCls, tripCol, "max-w-[160px] truncate text-muted-foreground")}>{leadService(l)}</td>
              <td className={tdCls}>
                <LeadBadge status={l.status} />
              </td>
              {showAssignee && <td className={cn(tdCls, "text-foreground")}>{staffName(l.assignedTo)}</td>}
              <td className={cn(tdCls, "whitespace-nowrap text-muted-foreground")}>{fmtDate(l.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

const PAYMENT_BADGES: Record<PaymentStatus, { label: string; className: string }> = {
  FULL: { label: "Paid", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  PARTIAL: { label: "Advance paid", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  PENDING: { label: "Pending", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
};

export function RecentBookingsTable({ rows }: { rows: RecentBookingRow[] }) {
  if (rows.length === 0) return <EmptyRow>No bookings yet.</EmptyRow>;
  return (
    <>
    <CardList>
      {rows.map((b) => {
        const badge = PAYMENT_BADGES[b.paymentStatus];
        return (
          <CardItem
            key={b.id}
            href={`/admin/bookings/${b.id}/services`}
            person={<PersonCell name={b.guestName} phone={b.guestPhone} />}
            aside={
              <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", badge.className)}>{badge.label}</span>
            }
          >
            <span className="font-semibold text-foreground">{inr(b.amount)}</span>
            <span className="min-w-0 truncate">{b.destination}</span>
            <span className="whitespace-nowrap">{fmtDate(b.createdAt)}</span>
          </CardItem>
        );
      })}
    </CardList>
    <div className={tableWrap}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className={thCls}>Customer</th>
            <th className={cn(thCls, tripCol)}>Trip</th>
            <th className={thCls}>Amount</th>
            <th className={thCls}>Payment</th>
            <th className={thCls}>Booked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((b) => {
            const badge = PAYMENT_BADGES[b.paymentStatus];
            return (
              <tr key={b.id} className="transition hover:bg-muted/50">
                <td className={tdCls}>
                  <Link href={`/admin/bookings/${b.id}/services`}>
                    <PersonCell name={b.guestName} phone={b.guestPhone} />
                  </Link>
                </td>
                <td className={cn(tdCls, tripCol, "max-w-[160px] truncate text-muted-foreground")}>{b.destination}</td>
                <td className={cn(tdCls, "whitespace-nowrap font-semibold text-foreground")}>{inr(b.amount)}</td>
                <td className={tdCls}>
                  <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", badge.className)}>
                    {badge.label}
                  </span>
                </td>
                <td className={cn(tdCls, "whitespace-nowrap text-muted-foreground")}>{fmtDate(b.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}
