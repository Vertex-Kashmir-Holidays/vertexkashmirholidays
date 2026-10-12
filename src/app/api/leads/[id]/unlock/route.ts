import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
import { logPaymentAudit } from "@/lib/bookings/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Admin-only correction action: unlock a converted lead, its itinerary and
 * its booking's services — the same scope as the booking page's "Unlock for
 * changes" (bookings/[id]/unlock-services), so either entry point leaves the
 * itinerary AND services editable. Re-locking goes through lock-services. */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "edit");
  if (guard instanceof NextResponse) return guard;
  if (!isAdminRole(guard.user.role)) {
    return NextResponse.json({ error: "Only an admin can unlock a lead." }, { status: 403 });
  }
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      locked: true,
      b2bAgentId: true,
      booking: { select: { id: true, servicesLocked: true } },
    },
  });
  // B2B requests are managed exclusively via /api/admin/b2b-requests.
  if (!lead || lead.b2bAgentId !== null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const unlockServices = !!lead.booking?.servicesLocked;
  if (!lead.locked && !unlockServices) return NextResponse.json({ ok: true });

  await prisma.$transaction([
    prisma.lead.update({ where: { id }, data: { locked: false } }),
    prisma.itinerary.updateMany({ where: { leadId: id }, data: { locked: false } }),
    ...(unlockServices
      ? [prisma.booking.update({ where: { id: lead.booking!.id }, data: { servicesLocked: false } })]
      : []),
    prisma.leadActivity.create({
      data: {
        leadId: id,
        type: "NOTE_ADDED",
        note: "Lead unlocked by admin for corrections.",
        performedById: guard.user.id as string,
        performedByName: (guard.user.name ?? guard.user.email) as string,
      },
    }),
  ]);
  if (unlockServices) {
    await logPaymentAudit({
      event: "SERVICES_UNLOCKED",
      bookingId: lead.booking!.id,
      status: "success",
      detail: `Unlocked for corrections (from the lead) by ${guard.user.name ?? guard.user.email}`,
    });
  }

  return NextResponse.json({ ok: true });
}
