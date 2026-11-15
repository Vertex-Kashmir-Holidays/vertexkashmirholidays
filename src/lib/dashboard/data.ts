// Dashboard data. One loader per widget so the page only runs the queries for
// the widgets the signed-in role may see (each is gated on a module permission
// in src/app/admin/dashboard/page.tsx).
//
// Scoping is the same as the Leads and Bookings pages: admins see everything;
// every other role sees the leads assigned to them and the bookings converted
// from those leads (bookingWhereForUser). B2B requests are excluded from lead
// figures — they're tracked under B2B Requests.
//
// Days and months are India time (IST), like the Trips board.
import { Prisma, type LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { computeBookingFinance, round2, type PaymentStatus } from "@/lib/bookings/finance";
import { getTripCards, todayIst } from "@/lib/trips/board";
import type { TripCard } from "@/lib/trips/types";

export interface DashboardUser {
  role: Role;
  userId: string;
  isAdmin: boolean;
}

/** IST midnight of a "YYYY-MM-DD" day, as an instant. */
const istStart = (ymd: string) => new Date(`${ymd}T00:00:00+05:30`);
/** "YYYY-MM" of an instant, in IST. */
const istMonth = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7);

/** The last six IST months, oldest first, as "YYYY-MM" plus their start instants. */
function lastSixMonths(today: string) {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (5 - i), 1));
    return d.toISOString().slice(0, 7);
  }).map((key, i, all) => ({ key, start: istStart(`${key}-01`), isNext: i === all.length - 1 }));
}

function leadScope(u: DashboardUser): Prisma.LeadWhereInput {
  return { b2bAgentId: null, ...(u.isAdmin ? {} : { assignedToId: u.userId }) };
}

async function bookingScope(u: DashboardUser): Promise<Prisma.BookingWhereInput> {
  return { deletedAt: null, ...(await bookingWhereForUser(u.role, u.userId)) };
}

/** Count instants per month over the last six months (oldest first). */
function monthlySeries(dates: Date[], months: ReturnType<typeof lastSixMonths>): number[] {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(istMonth(d), (counts.get(istMonth(d)) ?? 0) + 1);
  return months.filter((m) => !m.isNext).map((m) => counts.get(m.key) ?? 0);
}

export interface KpiStat {
  value: number;
  /** % change this month vs last month; null when there's nothing to compare. */
  change: number | null;
  series: number[];
}

function toKpi(series: number[]): KpiStat {
  const current = series.at(-1) ?? 0;
  const previous = series.at(-2) ?? 0;
  const change =
    previous === 0 ? (current > 0 ? 100 : null) : Math.round(((current - previous) / previous) * 100);
  return { value: current, change, series };
}

// ── KPI cards ────────────────────────────────────────────────────────────────

export async function getLeadKpis(u: DashboardUser, now = new Date()) {
  const months = lastSixMonths(todayIst(now));
  const scope = leadScope(u);

  const [leads, quotations] = await Promise.all([
    prisma.lead.findMany({
      where: { ...scope, createdAt: { gte: months[0].start } },
      select: { createdAt: true },
    }),
    // A quotation is "sent" when its itinerary is published to the customer.
    prisma.itinerary.findMany({
      where: { publishedAt: { gte: months[0].start }, lead: scope },
      select: { publishedAt: true },
    }),
  ]);

  return {
    leads: toKpi(monthlySeries(leads.map((l) => l.createdAt), months)),
    quotations: toKpi(monthlySeries(quotations.map((q) => q.publishedAt!), months)),
  };
}

export async function getBookingKpi(u: DashboardUser, now = new Date()): Promise<KpiStat> {
  const months = lastSixMonths(todayIst(now));
  const rows = await prisma.booking.findMany({
    where: {
      ...(await bookingScope(u)),
      status: { in: ["CONFIRMED", "PAID"] },
      createdAt: { gte: months[0].start },
    },
    select: { createdAt: true },
  });
  return toKpi(monthlySeries(rows.map((b) => b.createdAt), months));
}

// ── Sales pipeline ───────────────────────────────────────────────────────────

// Where every lead stands right now (all time, current status) — the same
// total as the Leads page, so the two never disagree.
const PIPELINE_STAGES: { status: LeadStatus; label: string }[] = [
  { status: "NEW", label: "New" },
  { status: "CONNECTED", label: "Connected" },
  { status: "QUALIFIED", label: "Qualified" },
  { status: "NEGOTIATION", label: "Negotiation" },
  { status: "CONVERTED", label: "Converted" },
];

export async function getPipeline(u: DashboardUser) {
  const groups = await prisma.lead.groupBy({
    by: ["status"],
    where: leadScope(u),
    _count: { _all: true },
  });
  const count = (s: LeadStatus) => groups.find((g) => g.status === s)?._count._all ?? 0;
  const total = groups.reduce((t, g) => t + g._count._all, 0);
  return {
    total,
    stages: PIPELINE_STAGES.map((s) => ({ ...s, count: count(s.status) })),
    others: [
      { label: "Not connected", count: count("NOT_CONNECTED") },
      { label: "On hold", count: count("ON_HOLD") },
      { label: "Rejected", count: count("REJECTED") },
    ],
  };
}

// ── Trips ────────────────────────────────────────────────────────────────────

export interface TripTask {
  label: string;
}

export interface DashboardTrip extends TripCard {
  daysLeft: number;
  balance: number;
  tasks: TripTask[];
}

const DRIVER_DUE_BUCKETS = new Set<TripCard["bucket"]>(["tomorrow", "onTour"]);

/** Upcoming and running trips with what's still left to do on each. */
export async function getUpcomingTrips(u: DashboardUser, now = new Date()): Promise<DashboardTrip[]> {
  const today = todayIst(now);
  const cards = (await getTripCards(u.role, u.userId, now)).filter((c) => c.bucket !== "completed");
  const money = await prisma.booking.findMany({
    where: { id: { in: cards.map((c) => c.id) } },
    select: {
      id: true,
      amount: true,
      discountType: true,
      discountValue: true,
      payments: { select: { amount: true, type: true } },
    },
  });
  const balanceOf = new Map(
    money.map((b) => [b.id, computeBookingFinance({ ...b, services: [] }).balance]),
  );

  return cards.map((c) => {
    const balance = round2(Math.max(0, balanceOf.get(c.id) ?? 0));
    const tasks: TripTask[] = [];
    if (!c.servicesLocked) tasks.push({ label: "Lock services" });
    if (c.unconfirmedHotels > 0) {
      tasks.push({ label: `Confirm ${c.unconfirmedHotels} hotel${c.unconfirmedHotels === 1 ? "" : "s"}` });
    }
    if (!c.driver && DRIVER_DUE_BUCKETS.has(c.bucket)) tasks.push({ label: "Add driver" });
    if (balance > 0) tasks.push({ label: `Collect ₹${balance.toLocaleString("en-IN")}` });
    const daysLeft = Math.round((Date.parse(c.startDate) - Date.parse(today)) / 86_400_000);
    return { ...c, daysLeft, balance, tasks };
  });
}

// ── Recent lists ─────────────────────────────────────────────────────────────

export async function getRecentLeads(u: DashboardUser) {
  return prisma.lead.findMany({
    where: leadScope(u),
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      createdAt: true,
      packageName: true,
      tour: { select: { title: true } },
      assignedTo: { select: { name: true, email: true } },
    },
  });
}

export interface RecentBookingRow {
  id: string;
  guestName: string;
  guestPhone: string;
  destination: string;
  amount: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

export async function getRecentBookings(u: DashboardUser): Promise<RecentBookingRow[]> {
  const rows = await prisma.booking.findMany({
    where: await bookingScope(u),
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      guestName: true,
      guestPhone: true,
      amount: true,
      discountType: true,
      discountValue: true,
      createdAt: true,
      tour: { select: { title: true } },
      leads: { take: 1, select: { packageName: true } },
      payments: { select: { amount: true, type: true } },
    },
  });
  return rows.map((b) => ({
    id: b.id,
    guestName: b.guestName,
    guestPhone: b.guestPhone,
    destination: b.tour?.title ?? b.leads[0]?.packageName ?? "Custom trip",
    amount: computeBookingFinance({ ...b, services: [] }).effectivePayable,
    paymentStatus: computeBookingFinance({ ...b, services: [] }).paymentStatus,
    createdAt: b.createdAt,
  }));
}

// ── Admin: revenue ───────────────────────────────────────────────────────────

/** Money collected (payments net of refunds) per booking month — admin only, so unscoped. */
export async function getRevenueByMonth(now = new Date()) {
  const months = lastSixMonths(todayIst(now));
  const bucketCase = Prisma.join(
    months
      .slice(0, 6)
      .map((m, i) => Prisma.sql`WHEN b."createdAt" >= ${m.start} AND b."createdAt" < ${months[i + 1].start} THEN ${i}`),
    " ",
  );
  const rows = await prisma.$queryRaw<{ bucket: number; revenue: number }[]>(Prisma.sql`
    SELECT (CASE ${bucketCase} END)::int AS bucket,
           COALESCE(SUM(CASE WHEN p."type" = 'REFUND' THEN -p."amount" ELSE p."amount" END), 0)::float8 AS revenue
    FROM "Booking" b
    LEFT JOIN "BookingPayment" p ON p."bookingId" = b.id
    WHERE b."deletedAt" IS NULL AND b."createdAt" >= ${months[0].start} AND b."createdAt" < ${months[6].start}
    GROUP BY 1
  `);
  return months.slice(0, 6).map((m, i) => ({
    month: new Date(`${m.key}-15T00:00:00Z`).toLocaleString("en-IN", { month: "short", year: "2-digit" }),
    revenue: round2(rows.find((r) => r.bucket === i)?.revenue ?? 0),
  }));
}

export async function getPendingReviews() {
  return prisma.review.findMany({
    where: { approved: false },
    take: 4,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, rating: true, body: true, tour: { select: { title: true } } },
  });
}

// ── Activity feed (Alerts & Reminders) ───────────────────────────────────────

export const ACTIVITY_HOURS = 72;

export interface ActivityItem {
  key: string;
  kind: "newLead" | "assigned" | "newBooking" | "confirmed" | "payment";
  title: string;
  detail: string;
  at: Date;
  href: string;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/**
 * What happened in the last 72 hours on the leads and bookings the user can
 * see: new leads, lead assignments, new bookings, bookings confirmed (first
 * services lock) and payments received. Newest first.
 */
export async function getActivity(
  u: DashboardUser,
  opts: { leads: boolean; bookings: boolean },
  now = new Date(),
): Promise<ActivityItem[]> {
  const since = new Date(now.getTime() - ACTIVITY_HOURS * 3_600_000);
  const scope = opts.bookings ? await bookingScope(u) : null;

  const [newLeads, assignments, newBookings, locks, payments] = await Promise.all([
    opts.leads
      ? prisma.lead.findMany({
          where: { ...leadScope(u), createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            name: true,
            createdAt: true,
            packageName: true,
            tour: { select: { title: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
          },
        })
      : [],
    opts.leads
      ? prisma.leadActivity.findMany({
          where: {
            type: "ASSIGNMENT_CHANGE",
            performedAt: { gte: since },
            toAssigneeId: u.isAdmin ? { not: null } : u.userId,
            lead: { b2bAgentId: null },
          },
          orderBy: { performedAt: "desc" },
          take: 10,
          select: {
            id: true,
            leadId: true,
            toAssigneeId: true,
            performedAt: true,
            performedByName: true,
            lead: { select: { name: true } },
          },
        })
      : [],
    scope
      ? prisma.booking.findMany({
          where: { ...scope, createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, guestName: true, amount: true, createdAt: true, tour: { select: { title: true } } },
        })
      : [],
    scope
      ? prisma.paymentAudit.findMany({
          where: { event: "SERVICES_LOCKED", createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, bookingId: true, createdAt: true },
        })
      : [],
    scope
      ? prisma.bookingPayment.findMany({
          where: { type: { not: "REFUND" }, createdAt: { gte: since }, booking: scope },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            amount: true,
            method: true,
            createdAt: true,
            booking: { select: { id: true, guestName: true } },
          },
        })
      : [],
  ]);

  // Audit rows aren't relations — keep only bookings in the user's scope.
  const lockedIds = [...new Set(locks.map((l) => l.bookingId).filter((id): id is string => !!id))];
  const lockedBookings = scope && lockedIds.length
    ? await prisma.booking.findMany({
        where: { ...scope, id: { in: lockedIds } },
        select: { id: true, guestName: true, travelDate: true },
      })
    : [];
  const assigneeIds = [...new Set(assignments.map((a) => a.toAssigneeId!))];
  const assignees = assigneeIds.length
    ? await prisma.user.findMany({ where: { id: { in: assigneeIds } }, select: { id: true, name: true, email: true } })
    : [];
  const nameOf = (id: string) => {
    const s = assignees.find((x) => x.id === id);
    return s ? (s.name ?? s.email) : "someone";
  };

  const items: ActivityItem[] = [
    ...newLeads.map((l) => ({
      key: `lead-${l.id}`,
      kind: "newLead" as const,
      title: u.isAdmin ? `New lead — ${l.name}` : `New lead assigned to you — ${l.name}`,
      detail: [
        l.tour?.title ?? l.packageName ?? "Enquiry",
        u.isAdmin ? (l.assignedTo ? `assigned to ${l.assignedTo.name ?? l.assignedTo.email}` : "unassigned") : null,
      ]
        .filter(Boolean)
        .join(" · "),
      at: l.createdAt,
      href: `/admin/leads/${l.id}`,
    })),
    ...assignments.map((a) => ({
      key: `assign-${a.id}`,
      kind: "assigned" as const,
      title: u.isAdmin ? `${a.lead.name} assigned to ${nameOf(a.toAssigneeId!)}` : `Lead assigned to you — ${a.lead.name}`,
      detail: `by ${a.performedByName}`,
      at: a.performedAt,
      href: `/admin/leads/${a.leadId}`,
    })),
    ...newBookings.map((b) => ({
      key: `booking-${b.id}`,
      kind: "newBooking" as const,
      title: `New booking — ${b.guestName}`,
      detail: `${b.tour?.title ?? "Custom trip"} · ${inr(b.amount)}`,
      at: b.createdAt,
      href: `/admin/bookings/${b.id}/services`,
    })),
    ...locks.flatMap((l) => {
      const b = lockedBookings.find((x) => x.id === l.bookingId);
      if (!b) return [];
      return [
        {
          key: `confirmed-${l.id}`,
          kind: "confirmed" as const,
          title: `Booking confirmed — ${b.guestName}`,
          detail: `Travelling ${b.travelDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}`,
          at: l.createdAt,
          href: `/admin/bookings/${b.id}/services`,
        },
      ];
    }),
    ...payments.map((p) => ({
      key: `payment-${p.id}`,
      kind: "payment" as const,
      title: `${inr(p.amount)} received — ${p.booking.guestName}`,
      detail: p.method ? `via ${p.method}` : "Payment recorded",
      at: p.createdAt,
      href: `/admin/bookings/${p.booking.id}/services`,
    })),
  ];

  // A lead assigned at creation shows once, as the assignment.
  const assignedLeadIds = new Set(assignments.map((a) => a.leadId));
  return items
    .filter((i) => i.kind !== "newLead" || !assignedLeadIds.has(i.key.slice(5)))
    .sort((a, b) => b.at.getTime() - a.at.getTime());
}
