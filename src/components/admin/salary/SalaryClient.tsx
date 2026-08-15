"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  MinusCircle,
  IndianRupee,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  FileDown,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { formatSalaryMonthLabel, parseSalaryMonth, formatSalaryMonth } from "@/lib/salary/month";

type Status = "DRAFT" | "REVIEW" | "PAID";

interface SalaryRecordDTO {
  id: string;
  employeeId: string;
  salaryMonth: string;
  monthlySalary: number;
  commission: number;
  commissionAdjustment: number;
  paidDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  deductions: number;
  netSalary: number;
  status: Status;
  employeeReviewedAt: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  correctedAt: string | null;
  correctionReason: string | null;
}

interface EmployeeLite {
  id: string;
  name: string | null;
  email: string;
  designation: string | null;
  employeeCode: string | null;
  monthlySalary: number | null;
}

interface FinanceRow {
  employee: EmployeeLite;
  record: SalaryRecordDTO | null;
}

interface Props {
  isFinance: boolean;
  defaultMonth: string;
}

const fmtINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const STATUS_STYLES: Record<Status | "UNPREPARED", string> = {
  DRAFT: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  REVIEW: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  PAID: "bg-green-500/15 text-green-700 dark:text-green-300",
  UNPREPARED: "bg-muted text-muted-foreground",
};

function monthOptions(defaultMonth: string, count: number): string[] {
  const { year, month } = parseSalaryMonth(defaultMonth);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    out.push(formatSalaryMonth(d.getUTCFullYear(), d.getUTCMonth() + 1));
  }
  return out;
}

export function SalaryClient({ isFinance, defaultMonth }: Props) {
  const [month, setMonth] = useState(defaultMonth);
  const [loading, setLoading] = useState(true);
  const [financeRows, setFinanceRows] = useState<FinanceRow[]>([]);
  const [selfRecords, setSelfRecords] = useState<SalaryRecordDTO[]>([]);
  const [modalRow, setModalRow] = useState<{ employee: EmployeeLite; record: SalaryRecordDTO | null } | null>(
    null,
  );
  const [viewRecord, setViewRecord] = useState<SalaryRecordDTO | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/salary?month=${month}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.isFinance) setFinanceRows(data.rows);
      else setSelfRecords(data.records);
    } catch {
      toast.error("Failed to load salary data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function refreshAfterChange() {
    setModalRow(null);
    load();
  }

  if (!isFinance) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">My Salary</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Your month-wise salary history.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : selfRecords.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-10 text-center text-sm text-muted-foreground">
            No salary records yet.
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border">
            {selfRecords.map((r) => (
              <button
                key={r.id}
                onClick={() => setViewRecord(r)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {formatSalaryMonthLabel(r.salaryMonth)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Net: {fmtINR(r.netSalary)}</p>
                </div>
                <span
                  className={cn(
                    "text-[12px] font-bold px-2.5 py-1 rounded-full",
                    STATUS_STYLES[r.status],
                  )}
                >
                  {r.status}
                </span>
              </button>
            ))}
          </div>
        )}

        {viewRecord && <SelfDetailModal record={viewRecord} onClose={() => setViewRecord(null)} />}
      </div>
    );
  }

  // ── Finance view ──
  const preparedCount = financeRows.filter((r) => r.record).length;
  const paidCount = financeRows.filter((r) => r.record?.status === "PAID").length;
  const pendingReviewCount = financeRows.filter((r) => r.record?.status === "REVIEW").length;
  const totalSalary = financeRows.reduce((s, r) => s + (r.record?.monthlySalary ?? 0), 0);
  const totalCommission = financeRows.reduce(
    (s, r) => s + (r.record ? r.record.commission + r.record.commissionAdjustment : 0),
    0,
  );
  const totalDeductions = financeRows.reduce((s, r) => s + (r.record?.deductions ?? 0), 0);
  const netPayroll = financeRows.reduce((s, r) => s + (r.record?.netSalary ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">
            Salary — {formatSalaryMonthLabel(month)}
          </h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {preparedCount}/{financeRows.length} prepared · {paidCount} paid
          </p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
        >
          {monthOptions(defaultMonth, 12).map((m) => (
            <option key={m} value={m}>
              {formatSalaryMonthLabel(m)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Total Salary"
          value={fmtINR(totalSalary)}
          icon={Wallet}
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Total Commission"
          value={fmtINR(totalCommission)}
          icon={TrendingUp}
          accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          label="Total Deductions"
          value={fmtINR(totalDeductions)}
          icon={MinusCircle}
          accent="bg-red-500/10 text-red-600 dark:text-red-400"
        />
        <StatCard
          label="Net Payroll"
          value={fmtINR(netPayroll)}
          icon={IndianRupee}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Paid"
          value={paidCount}
          icon={CheckCircle2}
          accent="bg-green-500/10 text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Pending Review"
          value={pendingReviewCount}
          icon={Clock}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {[
                "Employee",
                "Monthly Salary",
                "Paid Days",
                "Absent Days",
                "Paid Leave",
                "LWP",
                "Commission",
                "Deductions",
                "Net Salary",
                "Status",
                "Actions",
              ].map((h) => (
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
                <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </td>
              </tr>
            ) : (
              financeRows.map(({ employee, record }) => (
                <tr key={employee.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground text-xs">{employee.name ?? "—"}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {employee.designation ?? employee.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-foreground">
                    {fmtINR(record?.monthlySalary ?? employee.monthlySalary ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {record?.paidDays ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {record?.absentDays ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {record?.paidLeaveDays ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {record?.unpaidLeaveDays ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {record ? fmtINR(record.commission + record.commissionAdjustment) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {record ? fmtINR(record.deductions) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-foreground">
                    {record ? fmtINR(record.netSalary) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-[12px] font-bold px-2 py-0.5 rounded-full",
                        STATUS_STYLES[record?.status ?? "UNPREPARED"],
                      )}
                    >
                      {record?.status ?? "Not prepared"}
                    </span>
                    {record?.correctedAt && (
                      <span className="ml-1.5 text-[10px] font-bold text-red-500 uppercase">
                        corrected
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setModalRow({ employee, record })}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border border-border text-foreground hover:bg-muted"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {record ? "Manage" : "Prepare"}
                      </button>
                      {record?.status === "PAID" && (
                        <a
                          href={`/api/salary/${record.id}/slip`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border border-border text-primary hover:bg-primary/10"
                        >
                          <FileDown className="w-3.5 h-3.5" /> PDF
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalRow && (
        <FinanceModal
          employee={modalRow.employee}
          record={modalRow.record}
          month={month}
          onClose={() => setModalRow(null)}
          onDone={refreshAfterChange}
        />
      )}
    </div>
  );
}

// ── Finance prepare/edit/review/pay modal ──
function FinanceModal({
  employee,
  record,
  month,
  onClose,
  onDone,
}: {
  employee: EmployeeLite;
  record: SalaryRecordDTO | null;
  month: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [reason, setReason] = useState("");
  const [paymentReference, setPaymentReference] = useState(record?.paymentReference ?? "");

  const [monthlySalary, setMonthlySalary] = useState(String(record?.monthlySalary ?? employee.monthlySalary ?? 0));
  const [paidDays, setPaidDays] = useState(String(record?.paidDays ?? 0));
  const [absentDays, setAbsentDays] = useState(String(record?.absentDays ?? 0));
  const [paidLeaveDays, setPaidLeaveDays] = useState(String(record?.paidLeaveDays ?? 0));
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState(String(record?.unpaidLeaveDays ?? 0));
  const [deductions, setDeductions] = useState(String(record?.deductions ?? 0));
  const [commissionAdjustment, setCommissionAdjustment] = useState(
    String(record?.commissionAdjustment ?? 0),
  );

  const isPaid = record?.status === "PAID";
  const fieldsLocked = isPaid && !correcting;

  async function prepare() {
    setPreparing(true);
    try {
      const res = await fetch("/api/salary/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee.id, salaryMonth: month }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Failed to prepare payroll.");
      toast.success("Payroll prepared.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to prepare payroll.");
    } finally {
      setPreparing(false);
    }
  }

  async function save(extra: Record<string, unknown> = {}) {
    if (!record) return;
    if (isPaid && !reason.trim()) {
      toast.error("A reason is required to correct a paid salary record.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/salary/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlySalary: parseFloat(monthlySalary) || 0,
          paidDays: parseFloat(paidDays) || 0,
          absentDays: parseFloat(absentDays) || 0,
          paidLeaveDays: parseFloat(paidLeaveDays) || 0,
          unpaidLeaveDays: parseFloat(unpaidLeaveDays) || 0,
          deductions: parseFloat(deductions) || 0,
          commissionAdjustment: parseFloat(commissionAdjustment) || 0,
          ...(isPaid ? { correctionReason: reason.trim() } : {}),
          ...extra,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Save failed.");
      toast.success("Saved.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!record) {
    return (
      <ModalShell title={`Prepare payroll — ${employee.name ?? employee.email}`} onClose={onClose}>
        <p className="text-sm text-muted-foreground">
          This creates the {formatSalaryMonthLabel(month)} payroll record for{" "}
          <span className="font-semibold text-foreground">{employee.name ?? employee.email}</span>,
          snapshotting their current monthly salary and claiming any earned booking commission for
          this month.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={prepare}
            disabled={preparing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {preparing && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Prepare Payroll
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title={`${employee.name ?? employee.email} — ${formatSalaryMonthLabel(month)}`}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumField label="Monthly Salary (₹)" value={monthlySalary} onChange={setMonthlySalary} disabled={fieldsLocked} />
          <NumField label="Deductions (₹)" value={deductions} onChange={setDeductions} disabled={fieldsLocked} />
          <NumField label="Paid Days" value={paidDays} onChange={setPaidDays} disabled={fieldsLocked} />
          <NumField label="Absent Days" value={absentDays} onChange={setAbsentDays} disabled={fieldsLocked} />
          <NumField label="Paid Leave" value={paidLeaveDays} onChange={setPaidLeaveDays} disabled={fieldsLocked} />
          <NumField label="Leave Without Pay" value={unpaidLeaveDays} onChange={setUnpaidLeaveDays} disabled={fieldsLocked} />
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">System Commission (from BookingCommission)</span>
            <span className="font-semibold text-foreground">{fmtINR(record.commission)}</span>
          </div>
        </div>
        <NumField
          label="Commission Adjustment (₹) — manual correction only"
          value={commissionAdjustment}
          onChange={setCommissionAdjustment}
          disabled={fieldsLocked}
        />

        {isPaid && !correcting && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-muted-foreground">
            This salary has been paid. Fields are locked —{" "}
            <button
              onClick={() => setCorrecting(true)}
              className="font-semibold text-amber-700 dark:text-amber-400 underline"
            >
              correct it
            </button>{" "}
            if a genuine mistake needs fixing.
          </div>
        )}
        {isPaid && correcting && (
          <div>
            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">
              Correction reason (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25"
              placeholder="Why is this being corrected?"
            />
          </div>
        )}

        {record.status !== "PAID" && (
          <div>
            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">
              Payment reference (optional, used when marking Paid)
            </label>
            <input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25"
              placeholder="Optional transaction/reference number"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
        >
          Close
        </button>
        {(!isPaid || correcting) && (
          <button
            onClick={() => save()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border border-border text-foreground hover:bg-muted disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </button>
        )}
        {record.status === "DRAFT" && (
          <button
            onClick={() => save({ status: "REVIEW" })}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Move to Review
          </button>
        )}
        {record.status === "REVIEW" && (
          <button
            onClick={() => save({ status: "PAID", paymentReference: paymentReference.trim() || null })}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            Mark Paid
          </button>
        )}
      </div>
    </ModalShell>
  );
}

// ── Employee self-service detail modal ──
function SelfDetailModal({ record, onClose }: { record: SalaryRecordDTO; onClose: () => void }) {
  return (
    <ModalShell title={`Salary — ${formatSalaryMonthLabel(record.salaryMonth)}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <Section title="Earnings">
          <Row label="Monthly Salary" value={fmtINR(record.monthlySalary)} />
          <Row label="Booking Commission" value={fmtINR(record.commission + record.commissionAdjustment)} />
        </Section>
        <Section title="Attendance">
          <Row label="Paid Days" value={String(record.paidDays)} />
          <Row label="Absent Days" value={String(record.absentDays)} />
          <Row label="Paid Leave" value={String(record.paidLeaveDays)} />
          <Row label="Leave Without Pay" value={String(record.unpaidLeaveDays)} />
        </Section>
        <Section title="Deductions">
          <Row label="Deductions" value={fmtINR(record.deductions)} />
        </Section>
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="font-bold text-foreground">Net Salary</span>
          <span className="font-extrabold text-lg text-foreground">{fmtINR(record.netSalary)}</span>
        </div>

        {record.status === "PAID" && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-xs space-y-1">
            <Row label="Payment Status" value="PAID" />
            {record.paidAt && (
              <Row label="Paid Date" value={new Date(record.paidAt).toLocaleDateString("en-IN")} />
            )}
            {record.paymentReference && (
              <Row label="Payment Reference" value={record.paymentReference} />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
        >
          Close
        </button>
        {record.status === "PAID" && (
          <a
            href={`/api/salary/${record.id}/slip`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border border-border text-primary hover:bg-primary/10"
          >
            <FileDown className="w-3.5 h-3.5" /> Download Salary Slip
          </a>
        )}
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-card rounded-2xl border border-border shadow-xl p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </label>
  );
}
