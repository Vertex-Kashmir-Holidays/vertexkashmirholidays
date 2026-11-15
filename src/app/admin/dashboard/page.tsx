import type { Metadata } from "next";
import Link from "next/link";
import {
  BellRing,
  BookOpen,
  CalendarCheck2,
  FileText,
  Filter,
  IndianRupee,
  Map,
  Plane,
  Plus,
  Send,
  Star,
  Tags,
  UserPlus,
  Users,
  Zap,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import type { ModuleKey } from "@/lib/rbac";
import { RevenueChart } from "@/components/admin/RevenueChartLazy";
import {
  getBookingKpi,
  getLeadKpis,
  getPendingReviews,
  getPipeline,
  getRecentBookings,
  getRecentLeads,
  getRevenueByMonth,
  getUpcomingTrips,
  getActivity,
  type DashboardUser,
} from "@/lib/dashboard/data";
import { KpiCard, Panel } from "@/components/admin/dashboard/parts";
import { Pipeline } from "@/components/admin/dashboard/Pipeline";
import {
  AlertsList,
  RecentBookingsTable,
  RecentLeadsTable,
  TripsTable,
  type Alert,
} from "@/components/admin/dashboard/Lists";

export const metadata: Metadata = { title: "Dashboard — Admin" };
export const dynamic = "force-dynamic";

// Role-aware dashboard: every widget is shown only when the signed-in role
// can view the module behind it (Roles & Permissions), and its data is scoped
// like that module's own page — admins see the whole company, sales see their
// own leads and trips. Data loaders: src/lib/dashboard/data.ts.

const QUICK_ACTIONS: {
  label: string;
  href: string;
  Icon: LucideIcon;
  module: ModuleKey;
  action: "view" | "create";
  className: string;
}[] = [
  { label: "Add Lead", href: "/admin/leads/new", Icon: UserPlus, module: "leads", action: "create", className: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-300" },
  { label: "Create Proposal", href: "/admin/proposals/new", Icon: FileText, module: "proposals", action: "create", className: "bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 dark:text-violet-300" },
  { label: "Create Itinerary", href: "/admin/itinerary/new", Icon: Map, module: "itinerary", action: "create", className: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300" },
  { label: "View Trips", href: "/admin/trips", Icon: Plane, module: "bookings", action: "view", className: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300" },
  { label: "Rate Cards", href: "/admin/rate-cards", Icon: Tags, module: "rateCards", action: "view", className: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300" },
  { label: "New Package", href: "/admin/packages/new", Icon: Plus, module: "packages", action: "create", className: "bg-primary/10 text-primary hover:bg-primary/20" },
  { label: "Add Blog Post", href: "/admin/blogs/new", Icon: BookOpen, module: "blogs", action: "create", className: "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300" },
];
const MAX_QUICK_ACTIONS = 5;

/** "5m ago", "3h ago", "Yesterday", "2d ago". */
function timeAgo(at: Date, now: Date): string {
  const mins = Math.max(0, Math.round((now.getTime() - at.getTime()) / 60_000));
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return hours < 48 ? "Yesterday" : `${Math.round(hours / 24)}d ago`;
}

const fmtINR = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`;

export default async function AdminDashboard() {
  const guard = await requireModuleView("dashboard");
  if (!guard.ok) return guard.page;
  const { role, userId } = guard;
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";
  const u: DashboardUser = { role, userId, isAdmin };

  const [session, canLeads, canBookings, canReviews, quickActions] = await Promise.all([
    auth(),
    can(role, "leads", "view"),
    can(role, "bookings", "view"),
    can(role, "reviews", "edit"),
    Promise.all(QUICK_ACTIONS.map(async (a) => ((await can(role, a.module, a.action)) ? a : null))).then(
      (list) => list.filter((a) => a !== null).slice(0, MAX_QUICK_ACTIONS),
    ),
  ]);
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const now = new Date();

  const [leadKpis, bookingKpi, pipeline, trips, recentLeads, recentBookings, revenue, reviews, activity] =
    await Promise.all([
      canLeads ? getLeadKpis(u) : null,
      canBookings ? getBookingKpi(u) : null,
      canLeads ? getPipeline(u) : null,
      canBookings ? getUpcomingTrips(u) : null,
      canLeads ? getRecentLeads(u) : null,
      canBookings ? getRecentBookings(u) : null,
      isAdmin ? getRevenueByMonth() : null,
      canReviews ? getPendingReviews() : null,
      canLeads || canBookings ? getActivity(u, { leads: canLeads, bookings: canBookings }) : [],
    ]);

  // Alerts & Reminders — "Needs attention": trips in the next 7 days (with
  // what's left to do, or just a heads-up when they're ready), most urgent
  // first. "Recent activity": the last 72 hours.
  const weekTrips = (trips ?? []).filter((t) => t.bucket !== "upcoming");
  const tripWhen = (t: (typeof weekTrips)[number]) =>
    t.bucket === "onTour" ? "On tour" : t.daysLeft <= 0 ? "Today" : t.daysLeft === 1 ? "Tomorrow" : `In ${t.daysLeft} days`;
  const tripAlerts: Alert[] = weekTrips
    .filter((t) => t.tasks.length > 0 || t.bucket !== "onTour")
    .map((t) =>
      t.tasks.length > 0
        ? {
            key: `trip-${t.id}`,
            kind: "trip",
            title: `Prepare trip — ${t.guestName}`,
            detail: t.tasks.map((x) => x.label).join(" · "),
            when: tripWhen(t),
            tone: t.daysLeft <= 1 ? "red" : "amber",
            href: `/admin/bookings/${t.id}/services`,
          }
        : {
            key: `upcoming-${t.id}`,
            kind: "upcoming",
            title: `Upcoming trip — ${t.guestName}`,
            detail: `${t.tourTitle ?? "Kashmir trip"} · ${t.travellers} traveller${t.travellers === 1 ? "" : "s"} · all set`,
            when: tripWhen(t),
            tone: "blue",
            href: `/admin/bookings/${t.id}/services`,
          },
    );
  const reminders: Alert[] = [
    ...tripAlerts.filter((a) => a.tone === "red"),
    ...tripAlerts.filter((a) => a.tone !== "red"),
  ];
  const activityAlerts: Alert[] = activity.map((a) => ({
    ...a,
    when: timeAgo(a.at, now),
    tone: a.kind === "payment" || a.kind === "confirmed" ? "green" : "muted",
  }));
  const alertCount = reminders.length + activityAlerts.length;

  const kpis = [
    leadKpis && {
      label: "Leads",
      value: leadKpis.leads.value,
      Icon: Users,
      tone: "blue" as const,
      series: leadKpis.leads.series,
      change: leadKpis.leads.change,
      sub: "this month vs last",
      href: "/admin/leads",
    },
    leadKpis && {
      label: "Quotations Sent",
      value: leadKpis.quotations.value,
      Icon: Send,
      tone: "green" as const,
      series: leadKpis.quotations.series,
      change: leadKpis.quotations.change,
      sub: "this month vs last",
      href: "/admin/itinerary",
    },
    bookingKpi && {
      label: "Bookings Confirmed",
      value: bookingKpi.value,
      Icon: CalendarCheck2,
      tone: "violet" as const,
      series: bookingKpi.series,
      change: bookingKpi.change,
      sub: "this month vs last",
      href: "/admin/bookings",
    },
  ].filter((k) => !!k);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-extrabold text-foreground">
          Welcome back, <span className="text-primary">{firstName}</span> 👋
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {now.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          })}
          {!isAdmin && canLeads ? " · showing your leads and trips" : ""}
        </p>
      </div>

      {kpis.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>
      )}

      {/* Pipeline · Alerts · Quick actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-[1.35fr_1fr_240px]">
        {pipeline && (
          <Panel
            title="Sales Pipeline"
            Icon={Filter}
            iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-300"
            badge={`${pipeline.total} leads`}
            href="/admin/leads"
          >
            <Pipeline {...pipeline} />
          </Panel>
        )}
        {(canLeads || canBookings) && (
          <Panel
            title="Alerts & Reminders"
            Icon={BellRing}
            iconClass="bg-rose-500/10 text-rose-600 dark:text-rose-300"
            badge={alertCount > 0 ? alertCount : undefined}
          >
            <AlertsList reminders={reminders.slice(0, 8)} activity={activityAlerts.slice(0, 12)} />
          </Panel>
        )}
        {quickActions.length > 0 && (
          <Panel
            title="Quick Actions"
            Icon={Zap}
            iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-300"
            className="lg:col-span-2 2xl:col-span-1"
          >
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 2xl:grid-cols-1">
              {quickActions.map(({ label, href, Icon, className }) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${className}`}
                >
                  <Icon className="h-4 w-4 shrink-0" /> {label}
                </Link>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {trips && (
        <Panel
          title="Upcoming Trips"
          Icon={Plane}
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
          badge={`${trips.length} trips`}
          href="/admin/trips"
        >
          <TripsTable trips={trips.slice(0, 6)} />
        </Panel>
      )}

      {/* Recent leads · Recent bookings */}
      {(recentLeads || recentBookings) && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {recentLeads && (
            <Panel
              title="Recent Leads"
              Icon={UserPlus}
              iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-300"
              href="/admin/leads"
            >
              <RecentLeadsTable rows={recentLeads} showAssignee={isAdmin} />
            </Panel>
          )}
          {recentBookings && (
            <Panel
              title="Recent Bookings"
              Icon={CalendarCheck2}
              iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
              href="/admin/bookings"
            >
              <RecentBookingsTable rows={recentBookings} />
            </Panel>
          )}
        </div>
      )}

      {/* Admin revenue · reviews */}
      {(revenue || reviews) && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
          {revenue && (
            <Panel
              title="Money Collected — Last 6 Months"
              Icon={IndianRupee}
              badge={fmtINR(revenue.reduce((t, m) => t + m.revenue, 0))}
              bodyClassName="p-4 sm:p-5"
            >
              <RevenueChart data={revenue} />
            </Panel>
          )}
          {reviews && (
            <Panel
              title="Reviews Awaiting Approval"
              Icon={Star}
              iconClass="bg-yellow-500/10 text-yellow-600 dark:text-yellow-300"
              badge={reviews.length > 0 ? reviews.length : undefined}
              href="/admin/reviews"
              hrefLabel="Manage"
            >
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">No reviews waiting.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {reviews.map((r) => (
                    <li key={r.id} className="px-4 py-3 sm:px-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-foreground">{r.name}</p>
                        <span className="flex shrink-0 gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </span>
                      </div>
                      <p className="truncate text-[12px] text-muted-foreground">{r.tour.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
