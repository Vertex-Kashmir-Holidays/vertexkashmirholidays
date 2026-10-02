import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { logPaymentAudit } from "@/lib/bookings/audit";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Admin-only correction action: unlock a booking's services so its services,
 * itinerary and trip/amount details can be edited again. For a lead-converted
 * booking this also unlocks the lead and its itinerary (admins may then edit
 * it — see resolveItineraryAccess). Status stays as-is; re-locking goes through
 * lock-services, which locks everything again (commission re-synced there). */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  if (!isAdminRole(guard.user.role)) {
    return NextResponse.json({ error: "Only an admin can unlock services." }, { status: 403 });
  }
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null, ...bookingWhereForUser(role, userId) },
    select: {
      id: true,
      servicesLocked: true,
      leads: { take: 1, select: { id: true, locked: true, status: true, b2bAgentId: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  // B2B requests are managed via their own pages, never unlocked from here.
  const lead = booking.leads[0];
  const unlockLead = !!lead && !lead.b2bAgentId && lead.status === "CONVERTED" && lead.locked;
  if (!booking.servicesLocked && !unlockLead) return NextResponse.json({ ok: true });

  const performedByName = (guard.user.name ?? guard.user.email) as string;
  await prisma.$transaction([
    prisma.booking.update({ where: { id }, data: { servicesLocked: false } }),
    ...(unlockLead
      ? [
          prisma.lead.update({ where: { id: lead.id }, data: { locked: false } }),
          prisma.itinerary.updateMany({ where: { leadId: lead.id }, data: { locked: false } }),
          prisma.leadActivity.create({
            data: {
              leadId: lead.id,
              type: "NOTE_ADDED",
              note: "Lead unlocked by admin for corrections (booking unlocked for changes).",
              performedById: userId,
              performedByName,
            },
          }),
        ]
      : []),
  ]);
  await logPaymentAudit({
    event: "SERVICES_UNLOCKED",
    bookingId: id,
    status: "success",
    detail: `Unlocked for corrections by ${guard.user.name ?? guard.user.email}`,
  });

  return NextResponse.json({ ok: true });
}
