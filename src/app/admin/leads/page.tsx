import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { LeadsClient } from "@/components/admin/leads/LeadsClient";

export const metadata: Metadata = { title: "Leads — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const [leads, total, staffUsers] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        source: true,
        category: true,
        adults: true,
        status: true,
        startDate: true,
        followUpAt: true,
        assignedTo: { select: { id: true, name: true } },
        createdAt: true,
      },
    }),
    prisma.lead.count(),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <LeadsClient initialLeads={leads} totalCount={total} staffUsers={staffUsers} />;
}
