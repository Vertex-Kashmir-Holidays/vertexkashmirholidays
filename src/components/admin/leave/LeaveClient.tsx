"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Check, X, Loader2, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/molecules/stat-card";

type LeaveType = "EARNED" | "SICK" | "UNPAID";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface LeaveRequestDTO {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  createdAt: string;
}

interface PendingRow extends LeaveRequestDTO {
  employee: { id: string; name: string | null; email: string; designation: string | null };
}

interface Balance {
  total: number;
  used: number;
  remaining: number;
}

const TYPE_LABELS: Record<LeaveType, string> = {
  EARNED: "Earned Leave",
  SICK: "Sick Leave",
  UNPAID: "Leave Without Pay",
};

const STATUS_STYLES: Record<LeaveStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  APPROVED: "bg-green-500/15 text-green-700 dark:text-green-300",
  REJECTED: "bg-red-500/15 text-red-700 dark:text-red-300",
  CANCELLED: "bg-muted text-muted-foreground",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function LeaveClient({ isManager }: { isManager: boolean }) {
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<LeaveRequestDTO[]>([]);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [month, setMonth] = useState<string>("");
  const [applying, setApplying] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leave${isManager ? "?scope=pending" : ""}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMine(data.mine);
      setPending(data.pending);
      setBalance(data.balance);
      setMonth(data.month);
    } catch {
      toast.error("Failed to load leave data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function review(id: string, status: "APPROVED" | "REJECTED" | "CANCELLED") {
    (async () => {
      try {
        const res = await fetch(`/api/leave/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error ?? "Failed to update leave request.");
        toast.success(`Leave ${status.toLowerCase()}.`);
        load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update leave request.");
      }
    })();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Leave</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {month ? `Paid leave balance for ${month.slice(0, 4)}` : ""}
          </p>
        </div>
        <button
          onClick={() => setApplying(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Apply Leave
        </button>
      </div>

      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Leaves"
            value={`${balance.total} days`}
            icon={CalendarOff}
            accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Used"
            value={`${balance.used} days`}
            icon={CalendarOff}
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Remaining"
            value={`${balance.remaining} days`}
            icon={CalendarOff}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      {isManager && (
        <div className="bg-card rounded-2xl border border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-foreground text-sm">
              Pending Approvals {pending.length > 0 && `(${pending.length})`}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {["Employee", "Type", "Dates", "Days", "Reason", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No pending requests.
                    </td>
                  </tr>
                ) : (
                  pending.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground text-xs">
                          {r.employee.name ?? r.employee.email}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {r.employee.designation ?? r.employee.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{TYPE_LABELS[r.type]}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-foreground">{r.days}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                        {r.reason ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => review(r.id, "APPROVED")}
                            title="Approve"
                            className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border border-green-300 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => review(r.id, "REJECTED")}
                            title="Reject"
                            className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border border-red-300 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-foreground text-sm">My Leave History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {["Type", "Dates", "Days", "Reason", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </td>
                </tr>
              ) : mine.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No leave requests yet.
                  </td>
                </tr>
              ) : (
                mine.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-foreground font-semibold">
                      {TYPE_LABELS[r.type]}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">{r.days}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {r.reason ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-[12px] font-bold px-2 py-0.5 rounded-full",
                          STATUS_STYLES[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "PENDING" && (
                        <button
                          onClick={() => review(r.id, "CANCELLED")}
                          className="text-[12px] font-semibold px-2 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {applying && (
        <ApplyModal
          onClose={() => setApplying(false)}
          onApplied={() => {
            setApplying(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ApplyModal({ onClose, onApplied }: { onClose: () => void; onApplied: () => void }) {
  const [type, setType] = useState<LeaveType>("EARNED");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) return toast.error("Choose a date range.");
    const d = parseFloat(days);
    if (!d || d <= 0) return toast.error("Enter a valid number of days.");

    setSubmitting(true);
    (async () => {
      try {
        const res = await fetch("/api/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, startDate, endDate, days: d, reason: reason.trim() || undefined }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error ?? "Failed to apply for leave.");
        toast.success("Leave applied.");
        onApplied();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to apply for leave.");
      } finally {
        setSubmitting(false);
      }
    })();
  }

  const fieldCls =
    "mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground">Apply for leave</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close apply for leave dialog"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">
              Leave Type
            </span>
            <select value={type} onChange={(e) => setType(e.target.value as LeaveType)} className={fieldCls}>
              <option value="EARNED">Earned Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="UNPAID">Leave Without Pay</option>
            </select>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">
                Start date
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={fieldCls}
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">
                End date
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={fieldCls}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">
              Days (supports half-day, e.g. 0.5)
            </span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={fieldCls}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">
              Reason (optional)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className={fieldCls}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Applying…" : "Apply"}
          </button>
        </div>
      </form>
    </div>
  );
}
