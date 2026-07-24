"use client";

import dynamic from "next/dynamic";

// Recharts is a heavy client-only dependency that only the dashboard renders.
// Loading it through next/dynamic with ssr:false keeps it out of the initial
// admin JS payload and off the server render — the chart hydrates in after the
// dashboard shell paints. The loading placeholder matches the chart's 220px
// height to avoid layout shift.
export const RevenueChart = dynamic(
  () => import("./RevenueChart").then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] w-full animate-pulse rounded-xl bg-muted" />,
  },
);
