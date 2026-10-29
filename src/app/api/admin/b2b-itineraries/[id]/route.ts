import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { itineraryDataSchema } from "@/types/itinerary";
import { uniqueItineraryTitle } from "@/lib/itinerary/list";
import type { Prisma } from "@prisma/client";
import { resolveB2bItineraryAccess } from "@/lib/itinerary/access";
import { convertedBookingAmountUpdate, parseProposedAmount } from "@/lib/bookings/syncBookingAmount";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// Deliberately separate from /api/itineraries/[id] (which gates edit access
// via resolveItineraryAccess()'s assignee-only rule — B2B requests have no
// assignee concept). Both routes key by the ITINERARY id; this one only ever
// serves itineraries whose lead has b2bAgentId set, so a normal itinerary id
// 404s here exactly as a B2B one 404s on the generic route.
async function loadB2bItinerary(id: string) {
  const record = await prisma.itinerary.findUnique({
    where: { id },
    include: { lead: { select: { id: true, b2bAgentId: true, locked: true, status: true } } },
  });
  if (!record || record.lead?.b2bAgentId == null) return null;
  return record;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "view");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const record = await loadB2bItinerary(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: record.id,
    title: record.title,
    status: record.status,
    leadId: record.leadId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    data: record.data,
  });
}

// The title is generated from `data` (see documentTitle.ts), not accepted from the client.
const patchSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "CONFIRMED"]).optional(),
  data: itineraryDataSchema.optional(),
});

/**
 * Update/regenerate a B2B itinerary. Never touches Lead.status — it's already
 * IN_PROGRESS from creation (see .../b2b-requests/[id]/itinerary POST), and
 * an update is defined to keep it there, i.e. simply not change it.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await loadB2bItinerary(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Converted → locked with its booking; editable again only by an admin while
  // the booking is unlocked for changes (same rule as a customer's itinerary).
  const access = resolveB2bItineraryAccess(
    { locked: existing.locked, lead: existing.lead! },
    { role: guard.user.role, canEditItineraries: true },
  );
  if (!access.canEdit) {
    return NextResponse.json(
      {
        error: access.locked
          ? 'This itinerary is locked with its booking. An admin can use "Unlock for changes" on the booking to edit it.'
          : "Only an admin can edit a converted request's itinerary.",
        code: "ITINERARY_LOCKED",
      },
      { status: 423 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }

  const editedByName = (guard.user.name ?? guard.user.email) as string;
  // Standard unique name, as for lead-linked itineraries (see /api/itineraries/[id]).
  const title =
    parsed.data.data !== undefined ? await uniqueItineraryTitle(parsed.data.data, id) : undefined;

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.itinerary.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.data !== undefined ? { data: parsed.data.data } : {}),
        lastEditedById: guard.user.id,
      },
      select: { id: true, updatedAt: true },
    }),
  ];

  // Version history — same convention as the normal itinerary route.
  if (parsed.data.data !== undefined) {
    ops.push(
      prisma.itineraryHistory.create({
        data: {
          itineraryId: id,
          title: title ?? existing.title,
          data: parsed.data.data,
          editedById: guard.user.id,
          editedByName,
        },
      }),
    );

    // Converted request unlocked for corrections: its booking follows the new price.
    const proposed = parseProposedAmount(parsed.data.data.totalCost);
    if (proposed != null && existing.lead?.status === "CONVERTED") {
      const sync = await convertedBookingAmountUpdate(existing.lead.id, proposed);
      if (sync.error) return NextResponse.json({ error: sync.error }, { status: 422 });
      if (sync.op) {
        ops.push(
          sync.op,
          prisma.lead.update({ where: { id: existing.lead.id }, data: { negotiatedAmount: proposed } }),
        );
      }
    }
  }

  const [updated] = await prisma.$transaction(ops);
  return NextResponse.json(updated);
}
