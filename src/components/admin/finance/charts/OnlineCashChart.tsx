"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrencyCompact, formatMonthLabel } from "@/lib/format";

interface DataPoint {
  month: string;
  online: number;
  cash: number;
}

export function OnlineCashChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }} barCategoryGap="28%">
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
        <Bar dataKey="online" name="Online / Bank" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="cash" name="Cash" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
