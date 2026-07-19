import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AuditLogClient } from "@/components/admin/audit-log/AuditLogClient";

export const metadata: Metadata = { title: "Audit Log — Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminAuditLogPage() {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count(),
  ]);

  return (
    <AuditLogClient
      initialLogs={logs}
      initialTotal={total}
      initialPage={1}
      initialPageSize={PAGE_SIZE}
    />
  );
}
