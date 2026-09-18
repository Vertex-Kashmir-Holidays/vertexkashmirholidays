"use client";

import dynamic from "next/dynamic";

// Recharts is heavy and client-only — loaded via next/dynamic with ssr:false,
// same pattern as src/components/admin/RevenueChartLazy.tsx, so it never adds
// to the server render or the initial admin JS payload.

export const RevenueCostProfitChart = dynamic(
  () => import("./RevenueCostProfitChart").then((m) => m.RevenueCostProfitChart),
  { ssr: false, loading: () => <div className="h-[280px] w-full animate-pulse rounded-xl bg-muted" /> },
);

export const OnlineCashChart = dynamic(
  () => import("./OnlineCashChart").then((m) => m.OnlineCashChart),
  { ssr: false, loading: () => <div className="h-[240px] w-full animate-pulse rounded-xl bg-muted" /> },
);

export const TrendAreaChart = dynamic(
  () => import("./TrendAreaChart").then((m) => m.TrendAreaChart),
  { ssr: false, loading: () => <div className="h-[220px] w-full animate-pulse rounded-xl bg-muted" /> },
);
