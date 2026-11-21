import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { B2bCommunicationClient } from "@/components/admin/b2b/B2bCommunicationClient";

export const metadata: Metadata = { title: "B2B Communication — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminB2bCommunicationsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "b2bAgents", "view"))) redirect("/admin/dashboard");

  const [agents, requestStats, bookingStats, messages, canSend] = await Promise.all([
    prisma.user.findMany({
      where: { agencyStatus: { not: null }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, agencyName: true, email: true, agencyStatus: true, createdAt: true },
    }),
    prisma.lead.groupBy({
      by: ["b2bAgentId"],
      where: { b2bAgentId: { not: null } },
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.lead.groupBy({
      by: ["b2bAgentId"],
      where: { b2bAgentId: { not: null }, status: "CONVERTED" },
      _count: { _all: true },
    }),
    prisma.b2bMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        subject: true,
        message: true,
        attachmentName: true,
        recipients: true,
        sent: true,
        failed: true,
        sentByName: true,
        createdAt: true,
        request: { select: { id: true, name: true } },
      },
    }),
    can(role, "b2bAgents", "edit"),
  ]);

  const reqBy = new Map(requestStats.map((r) => [r.b2bAgentId, r]));
  const bookBy = new Map(bookingStats.map((r) => [r.b2bAgentId, r._count._all]));

  return (
    <B2bCommunicationClient
      canSend={canSend}
      agents={agents.map((a) => ({
        id: a.id,
        label: a.agencyName ?? a.name ?? a.email,
        contact: a.name,
        email: a.email,
        status: a.agencyStatus!,
        joinedAt: a.createdAt.toISOString(),
        requests: reqBy.get(a.id)?._count._all ?? 0,
        lastRequestAt: reqBy.get(a.id)?._max.createdAt?.toISOString() ?? null,
        bookings: bookBy.get(a.id) ?? 0,
      }))}
      messages={messages.map((m) => ({
        id: m.id,
        subject: m.subject,
        message: m.message,
        attachmentName: m.attachmentName,
        recipients: (m.recipients as { agencyName?: string | null; name?: string | null; email: string }[]).map(
          (r) => r.agencyName || r.name || r.email,
        ),
        sent: m.sent,
        failed: m.failed,
        sentByName: m.sentByName,
        createdAt: m.createdAt.toISOString(),
        request: m.request,
      }))}
    />
  );
}
