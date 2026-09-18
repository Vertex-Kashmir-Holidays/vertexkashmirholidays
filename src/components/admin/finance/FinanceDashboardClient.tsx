"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IndianRupee, Wallet, Banknote, Receipt, TrendingUp, X, Info, ChevronRight } from "lucide-react";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import { AdminSearchInput } from "@/components/ui/molecules/admin-search-input";
import { PageHeader } from "@/components/ui/molecules/page-header";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/atoms/tooltip";
import { DateRangeFilter } from "@/components/admin/finance/DateRangeFilter";
import { RevenueCostProfitChart, OnlineCashChart, TrendAreaChart } from "@/components/admin/finance/charts/FinanceChartsLazy";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";

interface BookingRow {
  id: string;
  travelDate: string;
  guestName: string;
  guestEmail: string | null;
  tourTitle: string | null;
  salesperson: string | null;
  bookingTotal: number;
  serviceCost: number;
  onlineAmount: number;
  cashAmount: number;
  paidAmount: number;
  gstAmount: number;
  profit: number;
}

interface Cards {
  totalBookingAmount: number;
  totalOnlineAmount: number;
  totalCashAmount: number;
  totalGst: number;
  totalProfit: number;
  count: number;
}

interface MonthlyPoint {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  online: number;
  cash: number;
  gst: number;
}

interface TourAggregate {
  tourId: string | null;
  tourTitle: string;
  revenue: number;
  profit: number;
  count: number;
}

interface Person {
  id: string;
  name: string | null;
  email: string;
}

interface Tour {
  id: string;
  title: string;
}

interface Props {
  initialBookings: BookingRow[];
  initialTotal: number;
  initialCards: Cards;
  initialMonthlySeries: MonthlyPoint[];
  initialTopTours: TourAggregate[];
  salespeople: Person[];
  tours: Tour[];
}

const EMPTY_FILTERS = {
  dateField: "travelDate" as "travelDate" | "createdAt",
  dateFrom: "",
  dateTo: "",
  salespersonId: "",
  tourId: "",
  paymentMode: "" as "" | "online" | "cash",
  customer: "",
  search: "",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Card label + an info tooltip explaining the financial term, per the CRM's
 * "not an accounting ledger" labeling requirement. */
function TermLabel({ text, tooltip }: { text: string; tooltip: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {text}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3 w-3 text-muted-foreground/60" aria-label={`About ${text}`} />
        </TooltipTrigger>
        <TooltipContent className="max-w-64">{tooltip}</TooltipContent>
      </Tooltip>
    </span>
  );
}

export function FinanceDashboardClient({
  initialBookings,
  initialTotal,
  initialCards,
  initialMonthlySeries,
  initialTopTours,
  salespeople,
  tours,
}: Props) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState({ customer: "", search: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<"travelDate" | "bookingTotal" | "profit" | "gstAmount">("travelDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [bookings, setBookings] = useState(initialBookings);
  const [total, setTotal] = useState(initialTotal);
  const [cards, setCards] = useState(initialCards);
  const [monthlySeries, setMonthlySeries] = useState(initialMonthlySeries);
  const [topTours, setTopTours] = useState(initialTopTours);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch({ customer: filters.customer, search: filters.search }),
      300,
    );
    return () => clearTimeout(t);
  }, [filters.customer, filters.search]);

  function buildParams(extra: Record<string, string>) {
    const params = new URLSearchParams(extra);
    if (filters.dateField !== "travelDate") params.set("dateField", filters.dateField);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.salespersonId) params.set("salespersonId", filters.salespersonId);
    if (filters.tourId) params.set("tourId", filters.tourId);
    if (filters.paymentMode) params.set("paymentMode", filters.paymentMode);
    if (debouncedSearch.customer) params.set("customer", debouncedSearch.customer);
    if (debouncedSearch.search) params.set("search", debouncedSearch.search);
    return params;
  }

  async function fetchAll(resetPage: boolean) {
    setLoading(true);
    try {
      const nextPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      const [bookingsRes, summaryRes] = await Promise.all([
        fetch(`/api/finance/bookings?${buildParams({ page: String(nextPage), pageSize: String(pageSize), sortBy, sortDir }).toString()}`),
        fetch(`/api/finance/bookings/summary?${buildParams({}).toString()}`),
      ]);
      if (!bookingsRes.ok || !summaryRes.ok) throw new Error();
      const bookingsData = (await bookingsRes.json()) as { bookings: BookingRow[]; total: number };
      const summaryData = (await summaryRes.json()) as {
        cards: Cards;
        monthlySeries: MonthlyPoint[];
        topTours: TourAggregate[];
      };
      setBookings(bookingsData.bookings);
      setTotal(bookingsData.total);
      setCards(summaryData.cards);
      setMonthlySeries(summaryData.monthlySeries);
      setTopTours(summaryData.topTours);
    } catch {
      toast.error("Failed to load Finance data.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTableOnly() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/finance/bookings?${buildParams({ page: String(page), pageSize: String(pageSize), sortBy, sortDir }).toString()}`,
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { bookings: BookingRow[]; total: number };
      setBookings(data.bookings);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  // Any filter change → refetch cards + charts + table (page reset to 1).
  useEffect(() => {
    if (!hasMounted.current) return;
    fetchAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.dateField,
    filters.dateFrom,
    filters.dateTo,
    filters.salespersonId,
    filters.tourId,
    filters.paymentMode,
    debouncedSearch.customer,
    debouncedSearch.search,
  ]);

  // Page/pageSize/sort change alone → table only, cards/charts unaffected.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    fetchTableOnly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortDir]);

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  function toggleSort(key: typeof sortBy) {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  // Totals for the rows currently on screen (this page) — not the full
  // filtered set, which the summary cards above already cover.
  const pageTotals = bookings.reduce(
    (acc, b) => ({
      bookingTotal: acc.bookingTotal + b.bookingTotal,
      serviceCost: acc.serviceCost + b.serviceCost,
      gstAmount: acc.gstAmount + b.gstAmount,
      profit: acc.profit + b.profit,
    }),
    { bookingTotal: 0, serviceCost: 0, gstAmount: 0, profit: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Financial performance of completed tours — CRM calculated, based on the existing GST and payment logic."
      />

      {/* Summary cards — completed tours only */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Booking Amount"
          value={formatCurrencyCompact(cards.totalBookingAmount)}
          icon={IndianRupee}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          sub="After discount, completed tours"
        />
        <StatCard
          label="Online / Bank"
          value={formatCurrencyCompact(cards.totalOnlineAmount)}
          icon={Wallet}
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Cash"
          value={formatCurrencyCompact(cards.totalCashAmount)}
          icon={Banknote}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label={
            <TermLabel
              text="Total GST"
              tooltip="Recorded GST — the GST already captured on non-cash booking payments, using the CRM's existing GST logic. Not a GST return filing figure."
            />
          }
          value={formatCurrencyCompact(cards.totalGst)}
          icon={Receipt}
          accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          sub="Recorded on non-cash payments"
        />
        <StatCard
          label={
            <TermLabel
              text="Total Profit"
              tooltip="CRM calculated — booking total minus service cost minus GST, floored at zero. Same formula the sales-commission calculation already uses."
            />
          }
          value={formatCurrencyCompact(cards.totalProfit)}
          icon={TrendingUp}
          accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
          sub="CRM calculated, same formula as commission"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select
          value={filters.dateField}
          onChange={(e) => setFilters((f) => ({ ...f, dateField: e.target.value as "travelDate" | "createdAt" }))}
          className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="travelDate">Travel date</option>
          <option value="createdAt">Booking date</option>
        </select>
        <DateRangeFilter
          from={filters.dateFrom}
          to={filters.dateTo}
          onFromChange={(v) => setFilters((f) => ({ ...f, dateFrom: v }))}
          onToChange={(v) => setFilters((f) => ({ ...f, dateTo: v }))}
          label=""
        />
        <select
          value={filters.salespersonId}
          onChange={(e) => setFilters((f) => ({ ...f, salespersonId: e.target.value }))}
          className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">All salespeople</option>
          <option value="direct">Direct bookings</option>
          {salespeople.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name ?? p.email}
            </option>
          ))}
        </select>
        <select
          value={filters.tourId}
          onChange={(e) => setFilters((f) => ({ ...f, tourId: e.target.value }))}
          className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">All tours</option>
          <option value="custom">Custom itinerary</option>
          {tours.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select
          value={filters.paymentMode}
          onChange={(e) => setFilters((f) => ({ ...f, paymentMode: e.target.value as "" | "online" | "cash" }))}
          className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">Any payment mode</option>
          <option value="online">Online / Bank</option>
          <option value="cash">Cash</option>
        </select>
        <div className="w-40">
          <AdminSearchInput
            value={filters.customer}
            onChange={(v) => setFilters((f) => ({ ...f, customer: v }))}
            placeholder="Customer…"
          />
        </div>
        <div className="w-44">
          <AdminSearchInput
            value={filters.search}
            onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
            placeholder="Booking / reference…"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Revenue vs Cost vs Profit</h3>
          <RevenueCostProfitChart data={monthlySeries} />
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Online vs Cash Collections</h3>
          <OnlineCashChart data={monthlySeries} />
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">GST Recorded (Monthly)</h3>
          <TrendAreaChart data={monthlySeries.map((m) => ({ month: m.month, value: m.gst }))} color="hsl(270 60% 55%)" />
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Profit Trend</h3>
          <TrendAreaChart data={monthlySeries.map((m) => ({ month: m.month, value: m.profit }))} color="hsl(158 64% 28%)" />
        </div>
      </div>

      {topTours.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <h3 className="text-sm font-bold text-foreground p-4 pb-0">Top Tours by Revenue</h3>
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-semibold">Tour</th>
                <th className="px-4 py-2 font-semibold text-right">Bookings</th>
                <th className="px-4 py-2 font-semibold text-right">Revenue</th>
                <th className="px-4 py-2 font-semibold text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {topTours.map((t) => (
                <tr key={t.tourId ?? "custom"} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-0">{t.tourTitle}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{t.count}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-foreground">{formatCurrency(t.revenue)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(t.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="p-3 w-8" />
                <th className="p-3 font-semibold">Booking</th>
                <th className="p-3 font-semibold">Customer</th>
                <th className="p-3 font-semibold">Salesperson</th>
                <th className="p-3 font-semibold text-right cursor-pointer" onClick={() => toggleSort("bookingTotal")}>
                  Booking Total {sortBy === "bookingTotal" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="p-3 font-semibold cursor-pointer" onClick={() => toggleSort("travelDate")}>
                  Travel Date {sortBy === "travelDate" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="p-3 font-semibold text-right">Service Cost</th>
                <th className="p-3 font-semibold text-right cursor-pointer" onClick={() => toggleSort("gstAmount")}>
                  GST {sortBy === "gstAmount" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="p-3 font-semibold text-right cursor-pointer" onClick={() => toggleSort("profit")}>
                  Profit {sortBy === "profit" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const isOpen = expandedId === b.id;
                return (
                  <Fragment key={b.id}>
                    <tr
                      onClick={() => setExpandedId(isOpen ? null : b.id)}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/30 cursor-pointer"
                    >
                      <td className="p-3">
                        <ChevronRight
                          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                        />
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{b.id.slice(0, 10)}…</td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{b.guestName}</div>
                        {b.guestEmail && <div className="text-xs text-muted-foreground">{b.guestEmail}</div>}
                      </td>
                      <td className="p-3 text-muted-foreground">{b.salesperson ?? "Direct Booking"}</td>
                      <td className="p-3 text-right font-semibold text-foreground">{formatCurrency(b.bookingTotal)}</td>
                      <td className="p-3 text-muted-foreground">{fmtDate(b.travelDate)}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatCurrency(b.serviceCost)}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatCurrency(b.gstAmount)}</td>
                      <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(b.profit)}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-border/60 bg-muted/20 dark:bg-black/20">
                        <td colSpan={9} className="px-3 py-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pl-8 text-xs">
                            <div>
                              <p className="text-muted-foreground mb-0.5">Tour</p>
                              <p className="font-semibold text-foreground">{b.tourTitle ?? "Custom Itinerary"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-0.5">Online / Bank</p>
                              <p className="font-semibold text-foreground">{formatCurrency(b.onlineAmount)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-0.5">Cash</p>
                              <p className="font-semibold text-foreground">{formatCurrency(b.cashAmount)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-0.5">Total Received</p>
                              <p className="font-semibold text-foreground">{formatCurrency(b.paidAmount)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {bookings.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">
                    No completed tours match these filters.
                  </td>
                </tr>
              )}
            </tbody>
            {bookings.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30 font-bold text-foreground">
                  <td className="p-3" colSpan={4}>
                    Page Total
                  </td>
                  <td className="p-3 text-right">{formatCurrency(pageTotals.bookingTotal)}</td>
                  <td className="p-3" />
                  <td className="p-3 text-right">{formatCurrency(pageTotals.serviceCost)}</td>
                  <td className="p-3 text-right">{formatCurrency(pageTotals.gstAmount)}</td>
                  <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(pageTotals.profit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="p-3 border-t border-border">
          <TablePagination
            page={page}
            pageSize={pageSize}
            pageCount={Math.max(1, Math.ceil(total / pageSize))}
            total={total}
            onPage={setPage}
            onPageSize={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            noun="completed bookings"
          />
        </div>
      </div>
    </div>
  );
}
