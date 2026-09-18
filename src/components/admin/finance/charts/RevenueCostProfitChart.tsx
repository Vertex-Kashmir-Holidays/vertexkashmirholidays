"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrencyCompact, formatMonthLabel } from "@/lib/format";

interface DataPoint {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

export function RevenueCostProfitChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonthLabel}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCurrencyCompact}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          formatter={(v) => formatCurrencyCompact(Number(v))}
          labelFormatter={(l) => formatMonthLabel(String(l))}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" name="Revenue" fill="hsl(158 64% 28%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="cost" name="Booking Cost" fill="hsl(24 74% 58%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Line
          dataKey="profit"
          name="Profit"
          stroke="hsl(217 91% 60%)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "hsl(217 91% 60%)", strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
