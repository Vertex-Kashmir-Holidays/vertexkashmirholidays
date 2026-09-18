"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Settings2, Pencil, Trash2, X, AlertTriangle, Loader2, IndianRupee, CalendarDays, Megaphone, Wallet, Layers } from "lucide-react";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import { AdminSearchInput } from "@/components/ui/molecules/admin-search-input";
import { PageHeader } from "@/components/ui/molecules/page-header";
import { DateRangeFilter } from "@/components/admin/finance/DateRangeFilter";
import { TrendAreaChart } from "@/components/admin/finance/charts/FinanceChartsLazy";
import { ExpenseFormDialog, type ExpenseFormValues } from "@/components/admin/finance/ExpenseFormDialog";
import { CategoryManagerDialog } from "@/components/admin/finance/CategoryManagerDialog";
import { PAYMENT_METHODS } from "@/lib/payments/gst";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";

interface Category {
  id: string;
  name: string;
  isSystem: boolean;
}
interface Person {
  id: string;
  name: string | null;
  email: string;
}

interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  salaryRecordId: string | null;
  createdAt: string;
  category: Category;
  employee: Person | null;
  createdBy: Person;
}

interface Cards {
  totalExpenses: number;
  currentMonthExpenses: number;
  marketingExpenses: number;
  salaryExpenses: number;
  otherExpenses: number;
}

interface Props {
  initialExpenses: Expense[];
  initialTotal: number;
  categories: Category[];
  employees: Person[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const EMPTY_FILTERS = {
  search: "",
  categoryId: "",
  paymentMethod: "",
  employeeId: "",
  dateFrom: "",
  dateTo: "",
};

const EMPTY_CARDS: Cards = {
  totalExpenses: 0,
  currentMonthExpenses: 0,
  marketingExpenses: 0,
  salaryExpenses: 0,
  otherExpenses: 0,
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ExpensesClient({
  initialExpenses,
  initialTotal,
  categories: initialCategories,
  employees,
  canCreate,
  canEdit,
  canDelete,
}: Props) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [categories, setCategories] = useState(initialCategories);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [total, setTotal] = useState(initialTotal);
  const [cards, setCards] = useState<Cards>(EMPTY_CARDS);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; total: number }[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ categoryId: string; categoryName: string; total: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formDefaults, setFormDefaults] = useState<ExpenseFormValues | undefined>(undefined);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasMounted = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  function buildParams(extra: Record<string, string>) {
    const params = new URLSearchParams(extra);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
    if (filters.employeeId) params.set("employeeId", filters.employeeId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (debouncedSearch) params.set("search", debouncedSearch);
    return params;
  }

  async function fetchExpenses(targetPage: number) {
    setLoading(true);
    try {
      const params = buildParams({
        page: String(targetPage),
        pageSize: String(pageSize),
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/finance/expenses?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { expenses: Expense[]; total: number };
      setExpenses(data.expenses);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSummary() {
    try {
      const params = buildParams({});
      const res = await fetch(`/api/finance/expenses/summary?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        cards: Cards;
        monthlyTrend: { month: string; total: number }[];
        categoryBreakdown: { categoryId: string; categoryName: string; total: number }[];
      };
      setCards(data.cards);
      setMonthlyTrend(data.monthlyTrend);
      setCategoryBreakdown(data.categoryBreakdown);
    } catch {
      toast.error("Failed to load expense summary.");
    }
  }

  async function refreshCategories() {
    const res = await fetch("/api/finance/expense-categories");
    if (res.ok) {
      const data = (await res.json()) as { categories: Category[] };
      setCategories(data.categories);
    }
  }

  // Filter change → cards/charts + table, reset to page 1.
  useEffect(() => {
    if (!hasMounted.current) return;
    setPage(1);
    fetchExpenses(1);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.categoryId, filters.paymentMethod, filters.employeeId, filters.dateFrom, filters.dateTo, debouncedSearch]);

  // Page/sort change → table only.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      fetchSummary();
      return;
    }
    fetchExpenses(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortDir]);

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  function toggleSort(key: "date" | "amount") {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  function openAdd() {
    setFormDefaults(undefined);
    setFormOpen(true);
  }
  function openEdit(e: Expense) {
    setFormDefaults({
      id: e.id,
      date: e.date.slice(0, 10),
      categoryId: e.category.id,
      description: e.description ?? "",
      amount: String(e.amount),
      paymentMethod: e.paymentMethod ?? "",
      employeeId: e.employee?.id ?? "",
      reference: e.reference ?? "",
      notes: e.notes ?? "",
    });
    setFormOpen(true);
  }
  function onSaved() {
    fetchExpenses(page);
    fetchSummary();
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    fetch(`/api/finance/expenses/${deleteTarget.id}`, { method: "DELETE" })
      .then(async (res) => {
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(j.error ?? "Failed to delete expense.");
          return;
        }
        toast.success("Expense deleted.");
        setDeleteTarget(null);
        fetchExpenses(page);
        fetchSummary();
      })
      .finally(() => setDeleting(false));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Business operating expenses — separate from booking/service costs."
        action={
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setCategoryDialogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Settings2 className="h-4 w-4" /> Categories
              </button>
            )}
            {canCreate && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Add Expense
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Expenses" value={formatCurrencyCompact(cards.totalExpenses)} icon={IndianRupee} accent="bg-slate-500/10 text-slate-600 dark:text-slate-400" />
        <StatCard label="This Month" value={formatCurrencyCompact(cards.currentMonthExpenses)} icon={CalendarDays} accent="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <StatCard label="Marketing" value={formatCurrencyCompact(cards.marketingExpenses)} icon={Megaphone} accent="bg-pink-500/10 text-pink-600 dark:text-pink-400" />
        <StatCard label="Salary" value={formatCurrencyCompact(cards.salaryExpenses)} icon={Wallet} accent="bg-amber-500/10 text-amber-600 dark:text-amber-400" sub="From existing Salary module" />
        <StatCard label="Other" value={formatCurrencyCompact(cards.otherExpenses)} icon={Layers} accent="bg-teal-500/10 text-teal-600 dark:text-teal-400" />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-wrap items-center gap-3">
        <DateRangeFilter
          from={filters.dateFrom}
          to={filters.dateTo}
          onFromChange={(v) => setFilters((f) => ({ ...f, dateFrom: v }))}
          onToChange={(v) => setFilters((f) => ({ ...f, dateTo: v }))}
          label=""
        />
        <select
          value={filters.categoryId}
          onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
          className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filters.paymentMethod}
          onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value }))}
          className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">All payment methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={filters.employeeId}
          onChange={(e) => setFilters((f) => ({ ...f, employeeId: e.target.value }))}
          className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">All employees</option>
          {employees.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name ?? p.email}
            </option>
          ))}
        </select>
        <div className="w-48">
          <AdminSearchInput value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v }))} placeholder="Search description, reference…" />
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Monthly Expense Trend</h3>
          <TrendAreaChart data={monthlyTrend.map((m) => ({ month: m.month, value: m.total }))} color="hsl(24 74% 58%)" />
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Expenses by Category</h3>
          <div className="space-y-2.5">
            {categoryBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
            )}
            {categoryBreakdown.map((c) => {
              const max = categoryBreakdown[0]?.total || 1;
              const pct = Math.round((c.total / max) * 100);
              return (
                <div key={c.categoryId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{c.categoryName}</span>
                    <span className="text-muted-foreground">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="p-3 font-semibold cursor-pointer" onClick={() => toggleSort("date")}>
                  Date {sortBy === "date" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Description</th>
                <th className="p-3 font-semibold">Employee</th>
                <th className="p-3 font-semibold">Method</th>
                <th className="p-3 font-semibold text-right cursor-pointer" onClick={() => toggleSort("amount")}>
                  Amount {sortBy === "amount" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="p-3 font-semibold">Created By</th>
                {(canEdit || canDelete) && <th className="p-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground">{fmtDate(e.date)}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                      {e.category.name}
                    </span>
                  </td>
                  <td className="p-3 text-foreground">{e.description ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{e.employee?.name ?? e.employee?.email ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{e.paymentMethod ?? "—"}</td>
                  <td className="p-3 text-right font-semibold text-foreground">{formatCurrency(e.amount)}</td>
                  <td className="p-3 text-muted-foreground">{e.createdBy.name ?? e.createdBy.email}</td>
                  {(canEdit || canDelete) && (
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {canEdit && (
                          <button onClick={() => openEdit(e)} aria-label={`Edit expense ${e.description ?? e.id}`} className="text-muted-foreground hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(e)} aria-label={`Delete expense ${e.description ?? e.id}`} className="text-muted-foreground hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {expenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                    No expenses match these filters.
                  </td>
                </tr>
              )}
            </tbody>
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
            noun="expenses"
          />
        </div>
      </div>

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        employees={employees}
        defaults={formDefaults}
        onSaved={onSaved}
      />
      <CategoryManagerDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={categories}
        onChanged={refreshCategories}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold text-foreground">Delete expense?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This will remove &ldquo;{deleteTarget.description ?? deleteTarget.category.name}&rdquo; ({formatCurrency(deleteTarget.amount)}) from Expenses. This can&apos;t be undone from this screen.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
