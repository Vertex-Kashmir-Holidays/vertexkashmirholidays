import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { LeadStatus, LeadCategory, LeadActivityType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "view");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { performedAt: "desc" } },
      assignedTo: { select: { id: true, name: true, email: true } },
      booking: { select: { id: true, status: true, amount: true, travelDate: true, guestName: true } },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // SALES users can only view leads assigned to them.
  const role = (guard.user as { role: string }).role;
  if (role === "SALES" && lead.assignedToId !== (guard.user.id as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(lead);
}

const patchSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  assignedToId: z.string().nullable().optional(),
  notes: z.string().optional(),
  category: z.nativeEnum(LeadCategory).nullable().optional(),
  adults: z.coerce.number().int().positive().optional(),
  children: z.coerce.number().int().min(0).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  followUpAt: z.string().nullable().optional(),
  bookingId: z.string().nullable().optional(),
  negotiatedAmount: z.coerce.number().positive().nullable().optional(),
  tokenAmount: z.coerce.number().positive().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // SALES users can only edit leads assigned to them.
  const role = (guard.user as { role: string }).role;
  if (role === "SALES" && existing.assignedToId !== (guard.user.id as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { status, assignedToId, startDate, endDate, notes, followUpAt, bookingId, negotiatedAmount, tokenAmount, ...rest } = parsed.data;

  if (bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true } });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  // Gate: CONVERTED requires negotiatedAmount AND tokenAmount to be set.
  if (status === LeadStatus.CONVERTED) {
    const effectiveNegotiated = negotiatedAmount !== undefined ? negotiatedAmount : existing.negotiatedAmount;
    const effectiveToken = tokenAmount !== undefined ? tokenAmount : existing.tokenAmount;
    if (!effectiveNegotiated || !effectiveToken) {
      return NextResponse.json(
        { error: "Cannot convert: both Negotiated Amount and Token Amount must be set and greater than zero." },
        { status: 422 },
      );
    }
  }

  const performedByName = (guard.user.name ?? guard.user.email) as string;
  const performedById = guard.user.id as string;

  const bookingChanged =
    bookingId !== undefined && (bookingId ?? null) !== (existing.bookingId ?? null);

  const [updated] = await prisma.$transaction([
    prisma.lead.update({
      where: { id },
      data: {
        ...rest,
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        ...(negotiatedAmount !== undefined && { negotiatedAmount }),
        ...(tokenAmount !== undefined && { tokenAmount }),
        ...(bookingId !== undefined && {
          booking: bookingId ? { connect: { id: bookingId } } : { disconnect: true },
        }),
        ...(assignedToId !== undefined && {
          assignedTo: assignedToId ? { connect: { id: assignedToId } } : { disconnect: true },
        }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(followUpAt !== undefined && { followUpAt: followUpAt ? new Date(followUpAt) : null }),
      },
    }),
    ...(status !== undefined && status !== existing.status
      ? [prisma.leadActivity.create({ data: { leadId: id, type: LeadActivityType.STATUS_CHANGE, fromStatus: existing.status, toStatus: status, performedById, performedByName } })]
      : []),
    ...(assignedToId !== undefined && assignedToId !== existing.assignedToId
      ? [prisma.leadActivity.create({ data: { leadId: id, type: LeadActivityType.ASSIGNMENT_CHANGE, fromAssigneeId: existing.assignedToId, toAssigneeId: assignedToId, performedById, performedByName } })]
      : []),
    ...(notes !== undefined && notes.trim() !== "" && notes !== (existing.notes ?? "")
      ? [prisma.leadActivity.create({ data: { leadId: id, type: LeadActivityType.NOTE_ADDED, note: notes, performedById, performedByName } })]
      : []),
    ...(followUpAt !== undefined && (followUpAt ? new Date(followUpAt).getTime() : null) !== (existing.followUpAt ? existing.followUpAt.getTime() : null)
      ? [prisma.leadActivity.create({ data: { leadId: id, type: LeadActivityType.FOLLOW_UP_SCHEDULED, note: followUpAt ? `Scheduled for ${new Date(followUpAt).toISOString().slice(0, 16).replace("T", " ")}` : "Follow-up cleared", performedById, performedByName } })]
      : []),
    ...(bookingChanged
      ? [prisma.leadActivity.create({ data: { leadId: id, type: LeadActivityType.BOOKING_LINKED, note: bookingId ? `Linked to booking ...${bookingId.slice(-8)}` : "Booking unlinked", performedById, performedByName } })]
      : []),
    // On conversion, lock the lead's current itinerary as the final canonical one.
    ...(status === LeadStatus.CONVERTED && existing.status !== LeadStatus.CONVERTED
      ? [prisma.itinerary.updateMany({ where: { leadId: id }, data: { locked: true, status: "CONFIRMED" } })]
      : []),
  ]);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "delete");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Converted leads are permanent business records and cannot be deleted.
  if (existing.status === LeadStatus.CONVERTED) {
    return NextResponse.json(
      { error: "A converted lead cannot be deleted." },
      { status: 422 },
    );
  }

  // Cascade rules (schema onDelete) clean up the linked itinerary, its history,
  // and the lead's activity timeline — no orphan records remain.
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
