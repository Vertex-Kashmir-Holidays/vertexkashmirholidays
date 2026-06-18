import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { LeadStatus, LeadCategory, LeadActivityType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

// Admin: get single lead with activity history.
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "view");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { performedAt: "desc" } },
      assignedTo: { select: { id: true, name: true } },
      booking: { select: { id: true, status: true, amount: true, travelDate: true, guestName: true } },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
});

// Admin: update lead fields. Status changes, assignment changes, booking linkage all write LeadActivity rows.
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  const { status, assignedToId, startDate, endDate, notes, followUpAt, bookingId, ...rest } = parsed.data;

  // Validate booking exists when linking.
  if (bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true } });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  // CONVERTED is gated: the lead must have a booking linked (existing or being set in this same call).
  const nextBookingId = bookingId !== undefined ? bookingId : existing.bookingId;
  if (status === LeadStatus.CONVERTED && !nextBookingId) {
    return NextResponse.json(
      { error: "CONVERTED status requires a linked booking." },
      { status: 422 },
    );
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
        ...(bookingId !== undefined && {
          booking: bookingId ? { connect: { id: bookingId } } : { disconnect: true },
        }),
        ...(assignedToId !== undefined && {
          assignedTo: assignedToId
            ? { connect: { id: assignedToId } }
            : { disconnect: true },
        }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(followUpAt !== undefined && { followUpAt: followUpAt ? new Date(followUpAt) : null }),
      },
    }),
    // Write activity row for status transitions.
    ...(status !== undefined && status !== existing.status
      ? [
          prisma.leadActivity.create({
            data: {
              leadId: id,
              type: LeadActivityType.STATUS_CHANGE,
              fromStatus: existing.status,
              toStatus: status,
              performedById,
              performedByName,
            },
          }),
        ]
      : []),
    // Write activity row for assignment changes.
    ...(assignedToId !== undefined && assignedToId !== existing.assignedToId
      ? [
          prisma.leadActivity.create({
            data: {
              leadId: id,
              type: LeadActivityType.ASSIGNMENT_CHANGE,
              fromAssigneeId: existing.assignedToId,
              toAssigneeId: assignedToId,
              performedById,
              performedByName,
            },
          }),
        ]
      : []),
    // Write activity row when notes are added or meaningfully changed.
    ...(notes !== undefined && notes.trim() !== "" && notes !== (existing.notes ?? "")
      ? [
          prisma.leadActivity.create({
            data: {
              leadId: id,
              type: LeadActivityType.NOTE_ADDED,
              note: notes,
              performedById,
              performedByName,
            },
          }),
        ]
      : []),
    // Write activity row when follow-up is set, changed, or cleared.
    ...(followUpAt !== undefined &&
      (followUpAt ? new Date(followUpAt).getTime() : null) !==
        (existing.followUpAt ? existing.followUpAt.getTime() : null)
      ? [
          prisma.leadActivity.create({
            data: {
              leadId: id,
              type: LeadActivityType.FOLLOW_UP_SCHEDULED,
              note: followUpAt
                ? `Scheduled for ${new Date(followUpAt).toISOString().slice(0, 16).replace("T", " ")}`
                : "Follow-up cleared",
              performedById,
              performedByName,
            },
          }),
        ]
      : []),
    // Write activity row when booking is linked or unlinked.
    ...(bookingChanged
      ? [
          prisma.leadActivity.create({
            data: {
              leadId: id,
              type: LeadActivityType.BOOKING_LINKED,
              note: bookingId
                ? `Linked to booking ...${bookingId.slice(-8)}`
                : "Booking unlinked",
              performedById,
              performedByName,
            },
          }),
        ]
      : []),
  ]);

  return NextResponse.json(updated);
}

// Admin: delete a lead.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "delete");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
