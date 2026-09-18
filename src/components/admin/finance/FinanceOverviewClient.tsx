"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Info,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  IndianRupee,
  TrendingUp,
  Wallet,
  Receipt,
} from "lucide-react";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { PageHeader } from "@/components/ui/molecules/page-header";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/atoms/tooltip";
import { DateRangeFilter } from "@/components/admin/finance/DateRangeFilter";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";

interface ProfitAndLoss {
  revenue: number;
  cost: number;
  gst: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
}

interface BusinessMoney {
  totalRevenue: number;
  onlineCollected: number;
  cashCollected: number;
  totalBookingCost: number;
  totalGst: number;
  totalOperatingExpenses: number;
  totalProfit: number;
  moneyIn: number;
  moneyOut: number;
  netPosition: number;
}

interface OverviewData {
  profitAndLoss: ProfitAndLoss;
  businessMoney: BusinessMoney;
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground/60 inline" aria-label="More about this figure" />
      </TooltipTrigger>
      <TooltipContent className="max-w-72">{text}</TooltipContent>
    </Tooltip>
  );
}

function CardHeader({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function LineRow({
  label,
  value,
  tooltip,
  variant = "default",
}: {
  label: string;
  value: number;
  tooltip: string;
  variant?: "default" | "subtract" | "total";
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 ${variant === "total" ? "border-t border-border mt-1 pt-3" : ""}`}
    >
      <span className={`flex items-center gap-1.5 text-sm ${variant === "total" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
        {variant === "subtract" && <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
        {label}
        <InfoTip text={tooltip} />
      </span>
      <span className={`text-sm font-semibold ${variant === "total" ? "text-lg text-foreground" : variant === "subtract" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
        {variant === "subtract" ? `− ${formatCurrency(value)}` : formatCurrency(value)}
      </span>
    </div>
  );
}

function MoneyTile({
  label,
  value,
  tooltip,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "in" | "out" | "net";
}) {
  const toneClasses = {
    in: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    out: "bg-red-500/10 text-red-700 dark:text-red-400",
    net: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  }[tone];
  return (
    <div className={`rounded-xl p-3.5 ${toneClasses}`}>
      <div className="flex items-center gap-1 text-xs font-semibold">
        <Icon className="h-3.5 w-3.5" /> {label}
        <InfoTip text={tooltip} />
      </div>
      <p className="text-xl font-extrabold text-foreground mt-1.5">{formatCurrency(value)}</p>
    </div>
  );
}

/** Simple proportional bar showing how revenue splits into cost / gross profit — a quick visual, not a full chart. */
function RevenueSplitBar({ revenue, cost, profit }: { revenue: number; cost: number; profit: number }) {
  const total = Math.max(revenue, cost + profit, 1);
  const costPct = Math.min(100, Math.round((cost / total) * 100));
  const profitPct = Math.min(100 - costPct, Math.round((profit / total) * 100));
  return (
    <div className="mb-4">
      <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
        <div className="h-full bg-orange-500" style={{ width: `${costPct}%` }} />
        <div className="h-full bg-emerald-500" style={{ width: `${profitPct}%` }} />
      </div>
      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Cost</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Gross Profit</span>
      </div>
    </div>
  );
}

export function FinanceOverviewClient({ initial }: { initial: OverviewData }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<OverviewData>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dateFrom && !dateTo) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`/api/finance/overview?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setData(await res.json());
      })
      .catch(() => toast.error("Failed to load Finance Overview."))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const { profitAndLoss: pnl, businessMoney: money } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Overview"
        description="CRM-calculated business performance — not an official GST return or accounting ledger."
        action={
          <div className="flex items-center gap-3">
            <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} label="Period" />
            {loading && <span className="text-xs text-muted-foreground">Updating…</span>}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue"
          value={formatCurrencyCompact(pnl.revenue)}
          icon={IndianRupee}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          sub="Completed tours"
        />
        <StatCard
          label="Gross Profit"
          value={formatCurrencyCompact(pnl.grossProfit)}
          icon={TrendingUp}
          accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
        />
        <StatCard
          label="Net Profit"
          value={formatCurrencyCompact(pnl.netProfit)}
          icon={Wallet}
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          sub="After operating expenses"
        />
        <StatCard
          label="Net Position"
          value={formatCurrencyCompact(money.netPosition)}
          icon={Scale}
          accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          sub="Money in − money out"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <CardHeader
            icon={Receipt}
            title="Profit & Loss"
            description="Completed tours only, based on the CRM's existing GST and profit logic."
          />
          <RevenueSplitBar revenue={pnl.revenue} cost={pnl.cost} profit={pnl.grossProfit} />
          <LineRow
            label="Completed Booking Revenue"
            value={pnl.revenue}
            tooltip="Estimated — sum of the booking total (after discount) for every completed tour in this period."
          />
          <LineRow
            label="Booking / Service Costs"
            value={pnl.cost}
            variant="subtract"
            tooltip="CRM calculated — sum of the recorded service costs (hotel/transport/activity/other) on each completed booking."
          />
          <LineRow
            label="GST (recorded)"
            value={pnl.gst}
            tooltip="Recorded GST — already netted into Gross Profit below using the CRM's existing GST logic; shown here for transparency, not subtracted a second time."
          />
          <LineRow
            label="Gross Profit"
            value={pnl.grossProfit}
            variant="total"
            tooltip="CRM calculated — Revenue minus Service Costs minus GST, floored at zero. Same formula the sales-commission calculation already uses."
          />
          <LineRow
            label="Operating Expenses"
            value={pnl.operatingExpenses}
            variant="subtract"
            tooltip="Recorded Expenses (excluding any linked to an already-counted Salary payout) plus salary actually paid via the existing Salary module in this period."
          />
          <LineRow
            label="Net Profit"
            value={pnl.netProfit}
            variant="total"
            tooltip="Estimated — Gross Profit minus Operating Expenses. The CRM's best estimate of what the business kept, not an audited net income figure."
          />
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <CardHeader
            icon={Scale}
            title="Business Money"
            description="Recorded collections and expenses — not a bank balance or cash-in-hand figure."
          />
          <div className="grid grid-cols-3 gap-3 mb-5">
            <MoneyTile
              label="Money In"
              value={money.moneyIn}
              icon={ArrowUpRight}
              tone="in"
              tooltip="Online/bank plus cash collected against completed tours in this period."
            />
            <MoneyTile
              label="Money Out"
              value={money.moneyOut}
              icon={ArrowDownRight}
              tone="out"
              tooltip="Operating expenses only (marketing, office, paid salary, etc.) — booking/service costs are excluded because the CRM doesn't track actual disbursements to suppliers."
            />
            <MoneyTile
              label="Net Position"
              value={money.netPosition}
              icon={Scale}
              tone="net"
              tooltip="Money In minus Money Out for this period. Not a bank balance — the CRM has no visibility into your actual bank account."
            />
          </div>
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {[
              { label: "Online / Bank Collected", value: money.onlineCollected },
              { label: "Cash Collected", value: money.cashCollected },
              { label: "Booking Costs", value: money.totalBookingCost },
              { label: "GST Recorded", value: money.totalGst },
              { label: "Operating Expenses", value: money.totalOperatingExpenses },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center px-3.5 py-2.5 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold text-foreground">{formatCurrency(row.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
