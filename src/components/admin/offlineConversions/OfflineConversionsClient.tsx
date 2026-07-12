"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  RotateCw,
  ListChecks,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Percent,
  Repeat,
  Download,
  Filter,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePagination } from "@/components/admin/ui/usePagination";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import { PlatformBadge } from "@/components/admin/offlineConversions/PlatformBadge";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  classifyFailure,
  extractRequestId,
  timeAgo,
  buildCsv,
  type CsvRow,
} from "@/lib/admin/offlineConversions";

type Platform = "GOOGLE" | "META" | "MICROSOFT";
type Status = "PENDING" | "SENT" | "FAILED";

const AUTO_REFRESH_KEY = "vkh_oc_auto_refresh";
const AUTO_REFRESH_MS = 30_000;

interface RowLead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  gclid: string | null;
  negotiatedAmount: number | null;
  source: string;
}

interface RowBooking {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string;
  gclid: string | null;
  amount: number;
  currency: string;
}

export interface OfflineConversionRow {
  id: string;
  leadId: string | null;
  bookingId: string | null;
  platform: Platform;
  status: Status;
  attempts: number;
  lastError: string | null;
  platformResponse: string | null;
  sentAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lead: RowLead | null;
  booking: RowBooking | null;
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  successRate: number;
  failedRate: number;
  avgAttempts: number;
}

interface PeriodStat {
  uploads: number;
  successRate: number;
  failedRate: number;
  avgAttempts: number;
}

interface Props {
  initialRows: OfflineConversionRow[];
  stats: Stats;
  periodStats: { today: PeriodStat; thisWeek: PeriodStat; thisMonth: PeriodStat };
  canRetry: boolean;
  destinationIds: Record<Platform, string | null>;
}

const selectCls =
  "pl-3 pr-8 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50 appearance-none";

const chipCls = (active: boolean) =>
  cn(
    "text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap",
    active ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:bg-muted",
  );

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", accent)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold text-foreground leading-none truncate">{value}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function PeriodCard({ label, stat }: { label: string; stat: PeriodStat }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-2.5">{label}</p>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-base font-extrabold text-foreground">{stat.uploads}</p>
          <p className="text-[12px] text-muted-foreground">Uploads</p>
        </div>
        <div>
          <p className="text-base font-extrabold text-green-600 dark:text-green-400">{stat.successRate}%</p>
          <p className="text-[12px] text-muted-foreground">Success</p>
        </div>
        <div>
          <p className="text-base font-extrabold text-red-600 dark:text-red-400">{stat.failedRate}%</p>
          <p className="text-[12px] text-muted-foreground">Failed</p>
        </div>
        <div>
          <p className="text-base font-extrabold text-foreground">{stat.avgAttempts}</p>
          <p className="text-[12px] text-muted-foreground">Avg. Attempts</p>
        </div>
      </div>
    </div>
  );
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `offline-conversions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function OfflineConversionsClient({ initialRows, stats, periodStats, canRetry, destinationIds }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"ALL" | Platform>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Advanced filter chips — all client-side against already-loaded rows, no new queries.
  const [advRetryable, setAdvRetryable] = useState(false);
  const [advHasRequestId, setAdvHasRequestId] = useState(false);
  const [advHasGclid, setAdvHasGclid] = useState(false);
  const [advHasError, setAdvHasError] = useState(false);
  const [advHasResponse, setAdvHasResponse] = useState(false);
  const [advMultiAttempt, setAdvMultiAttempt] = useState(false);
  const [advToday, setAdvToday] = useState(false);
  const [advThisWeek, setAdvThisWeek] = useState(false);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Restore auto-refresh preference from localStorage once on mount.
  useEffect(() => {
    setAutoRefresh(localStorage.getItem(AUTO_REFRESH_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => startTransition(() => router.refresh()), AUTO_REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  function toggleAutoRefresh() {
    setAutoRefresh((prev) => {
      const next = !prev;
      localStorage.setItem(AUTO_REFRESH_KEY, next ? "1" : "0");
      return next;
    });
  }

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const weekStart = useMemo(() => {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [todayStart]);

  const filtered = useMemo(() => {
    return initialRows.filter((row) => {
      if (platformFilter !== "ALL" && row.platform !== platformFilter) return false;
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;

      const created = new Date(row.createdAt).getTime();
      if (dateFrom && created < new Date(dateFrom).getTime()) return false;
      if (dateTo && created > new Date(dateTo).getTime() + 86_400_000) return false;

      if (advRetryable && row.status !== "FAILED") return false;
      if (advHasRequestId && !extractRequestId(row.platformResponse)) return false;
      if (advHasGclid && !(row.lead?.gclid || row.booking?.gclid)) return false;
      if (advHasError && !row.lastError) return false;
      if (advHasResponse && !row.platformResponse) return false;
      if (advMultiAttempt && row.attempts <= 1) return false;
      if (advToday && created < todayStart.getTime()) return false;
      if (advThisWeek && created < weekStart.getTime()) return false;

      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          row.leadId,
          row.bookingId,
          row.lead?.name,
          row.lead?.email,
          row.lead?.phone,
          row.lead?.gclid,
          row.booking?.guestName,
          row.booking?.guestEmail,
          row.booking?.guestPhone,
          row.booking?.gclid,
          row.platformResponse,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    initialRows,
    platformFilter,
    statusFilter,
    dateFrom,
    dateTo,
    search,
    advRetryable,
    advHasRequestId,
    advHasGclid,
    advHasError,
    advHasResponse,
    advMultiAttempt,
    advToday,
    advThisWeek,
    todayStart,
    weekStart,
  ]);

  const { page, setPage, pageSize, changePageSize, pageCount, total, pageItems } = usePagination(filtered);

  const failedIds = useMemo(() => filtered.filter((r) => r.status === "FAILED").map((r) => r.id), [filtered]);
  const anyAdvActive =
    advRetryable || advHasRequestId || advHasGclid || advHasError || advHasResponse || advMultiAttempt || advToday || advThisWeek;

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    const pageFailedIds = pageItems.filter((r) => r.status === "FAILED").map((r) => r.id);
    const allSelected = pageFailedIds.length > 0 && pageFailedIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageFailedIds.forEach((id) => next.delete(id));
      else pageFailedIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function retryOne(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/offline-conversions/${id}/retry`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      if (json.outcome === "sent") toast.success("Retried — sent successfully.");
      else toast.error("Retried — still failed. Check the error details.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Retry failed to run.");
    } finally {
      setBusyId(null);
    }
  }

  async function retryBulk(ids: string[]) {
    if (ids.length === 0) {
      toast.error("Nothing to retry.");
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/offline-conversions/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      toast.success(`Retried ${json.processed}: ${json.sent} sent, ${json.failed} still failed.`);
      setSelected(new Set());
      startTransition(() => router.refresh());
    } catch {
      toast.error("Bulk retry failed to run.");
    } finally {
      setBulkBusy(false);
    }
  }

  async function retryPending() {
    setBulkBusy(true);
    try {
      const res = await fetch("/api/offline-conversions/process-pending", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      toast.success(`Processed ${json.processed}: ${json.sent} sent, ${json.failed} failed.`);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Failed to process pending records.");
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCsv() {
    const rows: CsvRow[] = filtered.map((r) => ({
      leadName: r.lead?.name ?? null,
      bookingName: r.booking?.guestName ?? null,
      platform: r.platform,
      status: r.status,
      attempts: r.attempts,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      requestId: extractRequestId(r.platformResponse),
      failureTitle: classifyFailure(r.platform, r.lastError).title,
    }));
    downloadCsv(buildCsv(rows));
    toast.success(`Exported ${rows.length} rows to CSV.`);
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Offline Conversions</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {stats.total} total · monitor, inspect, and retry offline conversion uploads across every platform
          </p>
        </div>
        {/* Operations toolbar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {canRetry && (
            <>
              <button
                type="button"
                onClick={retryPending}
                disabled={bulkBusy}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm shadow-primary/25 disabled:opacity-60"
              >
                <RotateCw className="w-3.5 h-3.5" /> Retry Pending
              </button>
              <button
                type="button"
                onClick={() => retryBulk(failedIds)}
                disabled={bulkBusy || failedIds.length === 0}
                className="flex items-center gap-1.5 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                <RotateCw className="w-3.5 h-3.5" /> Retry Failed ({failedIds.length})
              </button>
            </>
          )}
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 border border-border text-xs font-bold px-3.5 py-2 rounded-xl transition-colors hover:bg-muted"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={isPending}
            className="flex items-center gap-1.5 border border-border text-xs font-bold px-3.5 py-2 rounded-xl transition-colors hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isPending && "animate-spin")} /> Refresh
          </button>
          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground cursor-pointer select-none pl-1">
            <input type="checkbox" className="cbx" checked={autoRefresh} onChange={toggleAutoRefresh} />
            Auto-refresh (30s)
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={Layers} accent="bg-slate-500/10 text-slate-600 dark:text-slate-400" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <StatCard label="Processing" value={stats.processing} icon={RotateCw} accent="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <StatCard label="Sent" value={stats.sent} icon={CheckCircle2} accent="bg-green-500/10 text-green-600 dark:text-green-400" />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} accent="bg-red-500/10 text-red-600 dark:text-red-400" />
        <StatCard label="Success Rate" value={`${stats.successRate}%`} icon={Percent} accent="bg-green-500/10 text-green-600 dark:text-green-400" />
        <StatCard label="Failed Rate" value={`${stats.failedRate}%`} icon={Percent} accent="bg-red-500/10 text-red-600 dark:text-red-400" />
        <StatCard label="Avg. Attempts" value={stats.avgAttempts} icon={Repeat} accent="bg-purple-500/10 text-purple-600 dark:text-purple-400" />
      </div>

      {/* Success-rate widget by period */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <PeriodCard label="Today" stat={periodStats.today} />
        <PeriodCard label="This Week" stat={periodStats.thisWeek} />
        <PeriodCard label="This Month" stat={periodStats.thisMonth} />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 p-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lead/booking ID, name, email, phone, GCLID, request ID..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>

          <div className="relative">
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as "ALL" | Platform)} className={selectCls}>
              <option value="ALL">All Platforms</option>
              <option value="GOOGLE">Google Ads</option>
              <option value="META">Meta</option>
              <option value="MICROSOFT">Microsoft Ads</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "ALL" | Status)} className={selectCls}>
              <option value="ALL">All Status</option>
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <p className="text-xs text-muted-foreground self-center shrink-0">{filtered.length} results</p>
        </div>

        {/* Advanced filters — collapsed by default, toggled open on click */}
        <div className="px-4 pb-3.5">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            <Filter className="w-3 h-3" />
            Advanced
            {anyAdvActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "rotate-180")} />
          </button>

          {showAdvanced && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <button type="button" onClick={() => setAdvRetryable((v) => !v)} className={chipCls(advRetryable)}>Retryable only</button>
              <button type="button" onClick={() => setAdvHasRequestId((v) => !v)} className={chipCls(advHasRequestId)}>Has Request ID</button>
              <button type="button" onClick={() => setAdvHasGclid((v) => !v)} className={chipCls(advHasGclid)}>Has GCLID</button>
              <button type="button" onClick={() => setAdvHasError((v) => !v)} className={chipCls(advHasError)}>Has Error</button>
              <button type="button" onClick={() => setAdvHasResponse((v) => !v)} className={chipCls(advHasResponse)}>Has Response</button>
              <button type="button" onClick={() => setAdvMultiAttempt((v) => !v)} className={chipCls(advMultiAttempt)}>Attempts &gt; 1</button>
              <button type="button" onClick={() => setAdvToday((v) => !v)} className={chipCls(advToday)}>Created Today</button>
              <button type="button" onClick={() => setAdvThisWeek((v) => !v)} className={chipCls(advThisWeek)}>Created This Week</button>
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {canRetry && selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 px-4 pb-3">
            <button
              type="button"
              onClick={() => retryBulk([...selected])}
              disabled={bulkBusy}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              <ListChecks className="w-3.5 h-3.5" /> Retry Selected ({selected.size})
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {canRetry && (
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      className="cbx"
                      checked={pageItems.some((r) => r.status === "FAILED") && pageItems.filter((r) => r.status === "FAILED").every((r) => selected.has(r.id))}
                      onChange={toggleSelectAllOnPage}
                      aria-label="Select all failed rows on this page"
                    />
                  </th>
                )}
                {["Lead", "Booking", "Platform", "Destination ID", "Status", "Attempts", "Last Attempt", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-sm font-bold text-foreground">No Offline Conversions Found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {search || platformFilter !== "ALL" || statusFilter !== "ALL" || anyAdvActive
                          ? "No rows match your current filters — try clearing a filter or widening the date range."
                          : "Offline conversions are queued automatically when a lead converts or a direct booking is paid. Nothing has been queued yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((row) => {
                  const customerName = row.lead?.name ?? row.booking?.guestName ?? "—";
                  const destinationId = destinationIds[row.platform];
                  const failure = classifyFailure(row.platform, row.lastError);
                  return (
                    <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                      {canRetry && (
                        <td className="px-4 py-3">
                          {row.status === "FAILED" && (
                            <input
                              type="checkbox"
                              className="cbx"
                              checked={selected.has(row.id)}
                              onChange={() => toggleSelected(row.id)}
                              aria-label={`Select ${row.id}`}
                            />
                          )}
                        </td>
                      )}

                      {/* Lead */}
                      <td className="px-4 py-3">
                        {row.lead ? (
                          <Link href={`/admin/leads/${row.lead.id}`} className="text-xs font-semibold text-primary hover:underline">
                            {customerName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>

                      {/* Booking */}
                      <td className="px-4 py-3">
                        {row.booking ? (
                          <Link href={`/admin/bookings/${row.booking.id}`} className="text-xs font-semibold text-primary hover:underline">
                            {row.booking.guestName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>

                      {/* Platform */}
                      <td className="px-4 py-3">
                        <PlatformBadge platform={row.platform} />
                      </td>

                      {/* Destination ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] text-muted-foreground">{destinationId ?? "—"}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={cn("text-[12px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", STATUS_STYLES[row.status])}>
                          {STATUS_LABELS[row.status]}
                        </span>
                        {row.status === "FAILED" && row.lastError && (
                          <p className="text-[12px] text-red-500/80 mt-0.5 max-w-[160px] truncate" title={row.lastError}>
                            {failure.title}
                          </p>
                        )}
                      </td>

                      {/* Attempts */}
                      <td className="px-4 py-3 text-xs text-muted-foreground text-center">{row.attempts}</td>

                      {/* Last Attempt */}
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap" title={row.attempts > 0 ? fmtDate(row.updatedAt) : undefined}>
                        {row.attempts > 0 ? timeAgo(row.updatedAt) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/offline-conversions/${row.id}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View detail"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {canRetry && row.status === "FAILED" && (
                            <button
                              type="button"
                              onClick={() => retryOne(row.id)}
                              disabled={busyId === row.id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                              title="Retry"
                            >
                              <RotateCw className={cn("w-3.5 h-3.5", busyId === row.id && "animate-spin")} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination page={page} pageSize={pageSize} pageCount={pageCount} total={total} onPage={setPage} onPageSize={changePageSize} noun="conversions" />
      </div>
    </div>
  );
}
