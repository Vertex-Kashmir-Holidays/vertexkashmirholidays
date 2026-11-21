import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getLeadTourOptions } from "@/lib/leads/tourOptions";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/itinerary/access";
import { LeadForm } from "@/components/admin/leads/LeadForm";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getLead = cache(async (id: string) =>
  prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      source: true,
      tourId: true,
      packageName: true,
      adults: true,
      children: true,
      startDate: true,
      endDate: true,
      followUpAt: true,
      assignedToId: true,
      notes: true,
      negotiatedAmount: true,
      tokenAmount: true,
      locked: true,
      assignedTo: { select: { name: true, email: true } },
    },
  }),
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lead = await getLead(id);
  return { title: lead ? `Edit ${lead.name} — Lead` : "Edit Lead — Admin" };
}

export default async function EditLeadPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const [lead, staffUsers, tours] = await Promise.all([
    getLead(id),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES"] }, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getLeadTourOptions(),
  ]);

  if (!lead) notFound();

  // Access rules (the form opens for the assignee or any admin — others not found):
  //  • Assignee or any admin on an active lead → full edit (admins don't need to
  //    reassign the lead to themselves first).
  //  • Anyone on a locked (converted) lead → view-only until an admin unlocks it.
  // The read-only state shows the form with a business message instead of a 404,
  // which would wrongly imply the lead doesn't exist.
  const isAssignee = lead.assignedToId === session?.user?.id;
  const isAdmin = isAdminRole(session?.user?.role);
  if (!isAssignee && !isAdmin) notFound();

  const canFullyEdit = !lead.locked && (isAssignee || isAdmin);
  const readOnly = !canFullyEdit;
  const readOnlyNotice = lead.locked
    ? {
        title: "This lead is locked",
        body: "It has been converted to a booking, so its details are read-only. An admin must unlock the lead before any changes can be made.",
      }
    : undefined;

  const defaultValues = {
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? "",
    source: lead.source,
    tourId: lead.tourId ?? "",
    packageName: lead.packageName ?? "",
    adults: String(lead.adults),
    children: lead.children != null ? String(lead.children) : "",
    startDate: lead.startDate ? new Date(lead.startDate).toISOString().slice(0, 10) : "",
    endDate: lead.endDate ? new Date(lead.endDate).toISOString().slice(0, 10) : "",
    followUpAt: lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 16) : "",
    assignedToId: lead.assignedToId ?? "",
    notes: lead.notes ?? "",
    negotiatedAmount: lead.negotiatedAmount != null ? String(lead.negotiatedAmount) : "",
    tokenAmount: lead.tokenAmount != null ? String(lead.tokenAmount) : "",
  };

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
          <li>
            <Link
              href={`/admin/leads/${lead.id}`}
              className="hover:text-primary transition-colors truncate max-w-[160px] inline-block align-bottom"
            >
              {lead.name}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium">
            {readOnly ? "View" : "Edit"}
          </li>
        </ol>
      </nav>

      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">
          {readOnly ? "View Lead" : "Edit Lead"}
        </h2>
        <p className="text-muted-foreground text-xs mt-0.5">
          {readOnly ? `${lead.name}'s details (read-only)` : `Update ${lead.name}'s details`}
        </p>
      </div>

      <LeadForm
        staffUsers={staffUsers}
        tours={tours}
        leadId={lead.id}
        defaultValues={defaultValues}
        readOnly={readOnly}
        readOnlyNotice={readOnlyNotice}
      />
    </div>
  );
}
