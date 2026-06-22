import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { canEditDriver } from "@/lib/bookings/driver";
import { sendDriverDetailsEmail } from "@/lib/bookings/notify";
import { z } from "zod";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  driverName: z.string().trim().min(2, "Driver name is required").max(100),
  driverPhone: z
    .string()
    .trim()
    .min(7, "A valid driver phone is required")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Driver phone may only contain digits and + - ( )"),
  vehicleNumber: z.string().trim().min(4, "Vehicle number is required").max(20),
  vehicleName: z.string().trim().min(2, "Vehicle name is required").max(60),
  sendEmail: z.boolean().optional().default(false),
});

/** Add or update the assigned driver/vehicle for a locked booking. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, servicesLocked: true, travelDate: true, driverAddedAt: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Driver details only make sense once the booking is finalised.
  if (!booking.servicesLocked) {
    return NextResponse.json(
      { error: "Lock the booking services before adding driver details." },
      { status: 422 },
    );
  }

  // Authoritative cutoff: no add/edit within one day of travel.
  if (!canEditDriver(booking.travelDate)) {
    return NextResponse.json(
      { error: "Driver details can only be changed up to one day before the travel date." },
      { status: 422 },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { driverName, driverPhone, vehicleNumber, vehicleName, sendEmail } = parsed.data;

  const isUpdate = booking.driverAddedAt !== null;
  const updated = await prisma.booking.update({
    where: { id },
    data: {
      driverName,
      driverPhone,
      vehicleNumber,
      vehicleName,
      // Stamp the first time details are added; preserve on later edits.
      ...(isUpdate ? {} : { driverAddedAt: new Date() }),
    },
    select: {
      driverName: true,
      driverPhone: true,
      vehicleNumber: true,
      vehicleName: true,
      driverAddedAt: true,
    },
  });

  let emailed = false;
  if (sendEmail) {
    const { delivered } = await sendDriverDetailsEmail(id, { updated: isUpdate });
    emailed = delivered;
  }

  return NextResponse.json({ ...updated, emailed, requestedEmail: sendEmail });
}
