import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { can, requirePermission } from "@/lib/permissions";
import { proposalDataSchema } from "@/types/proposal";
import { proposalToItineraryData } from "@/lib/proposal/toItinerary";
import { uniqueItineraryTitle } from "@/lib/itinerary/list";
import { isAdminRole } from "@/lib/itinerary/access";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  // The option the customer accepted (multi-package proposals only).
  tier: z.enum(["budget", "premium", "luxury"]).default("premium"),
  // Required — a converted itinerary is always the lead's final itinerary,
  // never a standalone orphan.
  leadId: z.string().min(1, "Select the lead this proposal is for."),
});

// "Convert to Itinerary": creates the lead's DRAFT itinerary pre-filled from
// the saved proposal (see src/lib/proposal/toItinerary.ts). Only a lead with
// no itinerary yet qualifies (one itinerary per lead), with the same lead
// scoping as POST /api/itineraries/[id]/link. The proposal is left unchanged.
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("proposals", "view");
  if (guard instanceof NextResponse) return guard;
  if (!(await can(guard.user.role as Role, "itinerary", "create"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const record = await prisma.proposalItinerary.findUnique({
    where: { id },
    select: { ownerId: true, data: true },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isAdmin = isAdminRole(guard.user.role);
  if (!isAdmin && record.ownerId !== guard.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }
  const parsedData = proposalDataSchema.safeParse(record.data);
  if (!parsedData.success) {
    return NextResponse.json({ error: "Proposal data is invalid." }, { status: 422 });
  }

  const { leadId, tier } = parsedBody.data;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      assignedToId: true,
      b2bAgentId: true,
      status: true,
      itinerary: { select: { id: true } },
    },
  });
  if (!lead || lead.b2bAgentId !== null) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  if (!isAdmin && lead.assignedToId !== guard.user.id) {
    return NextResponse.json({ error: "That lead isn't assigned to you." }, { status: 403 });
  }
  if (lead.status === "CONVERTED") {
    return NextResponse.json({ error: "That lead is already converted." }, { status: 422 });
  }
  if (lead.itinerary) {
    return NextResponse.json(
      { error: "That lead already has an itinerary linked to it." },
      { status: 409 },
    );
  }

  const data = proposalToItineraryData(parsedData.data, tier);
  // System-assigned, so a taken title gets a "(2)" suffix instead of a 409.
  const title = await uniqueItineraryTitle(data);
  const editedByName = (guard.user.name ?? guard.user.email) as string;
  try {
    // Seeded with its first history snapshot, same as POST /api/leads/[id]/itinerary.
    const created = await prisma.itinerary.create({
      data: {
        title,
        status: "DRAFT",
        data,
        ownerId: guard.user.id,
        leadId,
        history: { create: { title, data, editedById: guard.user.id, editedByName } },
      },
      select: { id: true },
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    // Lost a race with another itinerary for the same lead (leadId is @unique).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "That lead already has an itinerary linked to it." },
        { status: 409 },
      );
    }
    throw err;
  }
}
