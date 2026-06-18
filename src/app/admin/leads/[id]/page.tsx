import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LeadDetail } from "@/components/admin/leads/LeadDetail";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, select: { name: true } });
  return { title: lead ? `${lead.name} — Lead` : "Lead — Admin" };
}

export default async function AdminLeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [lead, staffUsers] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        activities: { orderBy: { performedAt: "desc" } },
        assignedTo: { select: { id: true, name: true } },
        booking: { select: { id: true, status: true, amount: true, travelDate: true, guestName: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!lead) notFound();

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/leads" className="hover:text-primary transition-colors">
              Leads
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{lead.name}</li>
        </ol>
      </nav>
      <LeadDetail lead={lead} staffUsers={staffUsers} />
    </div>
  );
}
