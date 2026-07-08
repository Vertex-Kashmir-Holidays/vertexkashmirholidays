import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import type { Role } from "@/lib/rbac";
import { getPlatformDestinationId } from "@/lib/admin/offlineConversions";
import { OfflineConversionsClient } from "@/components/admin/offlineConversions/OfflineConversionsClient";

export const metadata: Metadata = { title: "Offline Conversions — Admin" };
export const dynamic = "force-dynamic";

const ROW_SELECT = {
  id: true,
  leadId: true,
  bookingId: true,
  platform: true,
  status: true,
  attempts: true,
  lastError: true,
  platformResponse: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
  lead: { select: { id: true, name: true, email: true, phone: true, gclid: true, negotiatedAmount: true, source: true } },
  booking: { select: { id: true, guestName: true, guestEmail: true, guestPhone: true, gclid: true, amount: true, currency: true } },
} as const;

// Fixed set of aggregate queries scoped to a date range — no per-row loop, so
// this doesn't introduce N+1 regardless of how many periods are computed.
async function periodStats(since: Date) {
  const where = { createdAt: { gte: since } } as const;
  const [uploads, sent, failed, attemptsAgg] = await Promise.all([
    prisma.offlineConversion.count({ where }),
    prisma.offlineConversion.count({ where: { ...where, status: "SENT" } }),
    prisma.offlineConversion.count({ where: { ...where, status: "FAILED" } }),
    prisma.offlineConversion.aggregate({ where, _avg: { attempts: true } }),
  ]);
  return {
    uploads,
    successRate: uploads > 0 ? Math.round((sent / uploads) * 1000) / 10 : 0,
    failedRate: uploads > 0 ? Math.round((failed / uploads) * 1000) / 10 : 0,
    avgAttempts: Math.round((attemptsAgg._avg.attempts ?? 0) * 10) / 10,
  };
}

export default async function OfflineConversionsPage() {
  const session = await auth();
  const role = (session?.user?.role ?? "ADMIN") as Role;
  const canRetry = await can(role, "offlineConversions", "edit");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [rows, total, pending, sent, failed, attemptsAgg, today, thisWeek, thisMonth] = await Promise.all([
    prisma.offlineConversion.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: ROW_SELECT,
    }),
    prisma.offlineConversion.count(),
    prisma.offlineConversion.count({ where: { status: "PENDING" } }),
    prisma.offlineConversion.count({ where: { status: "SENT" } }),
    prisma.offlineConversion.count({ where: { status: "FAILED" } }),
    prisma.offlineConversion.aggregate({ _avg: { attempts: true } }),
    periodStats(startOfToday),
    periodStats(startOfWeek),
    periodStats(startOfMonth),
  ]);

  const stats = {
    total,
    pending,
    processing: 0, // not a reachable DB status today — see src/lib/admin/offlineConversions.ts
    sent,
    failed,
    successRate: total > 0 ? Math.round((sent / total) * 1000) / 10 : 0,
    failedRate: total > 0 ? Math.round((failed / total) * 1000) / 10 : 0,
    avgAttempts: Math.round((attemptsAgg._avg.attempts ?? 0) * 10) / 10,
  };

  // Resolved server-side (reads process.env — never available in the client
  // component); GOOGLE/META/MICROSOFT are the only platforms today.
  const destinationIds = {
    GOOGLE: getPlatformDestinationId("GOOGLE"),
    META: getPlatformDestinationId("META"),
    MICROSOFT: getPlatformDestinationId("MICROSOFT"),
  };

  return (
    <OfflineConversionsClient
      initialRows={rows}
      stats={stats}
      periodStats={{ today, thisWeek, thisMonth }}
      canRetry={canRetry}
      destinationIds={destinationIds}
    />
  );
}
