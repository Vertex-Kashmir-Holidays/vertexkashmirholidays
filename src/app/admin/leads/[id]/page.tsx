import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
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
  const session = await auth();

  const [lead, staffUsers] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        activities: { orderBy: { performedAt: "desc" } },
        assignedTo: { select: { id: true, name: true, email: true } },
        booking: { select: { id: true, status: true, amount: true, travelDate: true, guestName: true } },
        itinerary: {
          select: {
            id: true,
            title: true,
            status: true,
            locked: true,
            createdAt: true,
            updatedAt: true,
            owner: { select: { name: true, email: true } },
            lastEditedBy: { select: { name: true, email: true } },
            history: {
              select: { id: true, title: true, editedByName: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 20,
            },
            _count: { select: { history: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES"] }, deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!lead) notFound();

  const role = session?.user?.role;

  // Role-based lead visibility: SALES may only open leads assigned to them
  // (matches the GET /api/leads/[id] guard — enforced server-side, not just UI).
  if (role === "SALES" && lead.assignedToId !== session?.user?.id) notFound();

  // UI-only flag (the API independently enforces these rules server-side):
  // a user may manage this lead's itinerary if they have itinerary-edit
  // permission AND are an admin or the lead's assignee.
  const canManageItinerary =
    !!role &&
    (await can(role, "itinerary", "edit")) &&
    (isAdminRole(role) || lead.assignedToId === session?.user?.id);

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
      <LeadDetail
        lead={lead}
        staffUsers={staffUsers}
        canManageItinerary={canManageItinerary}
        isAdmin={!!role && isAdminRole(role)}
      />
    </div>
  );
}
