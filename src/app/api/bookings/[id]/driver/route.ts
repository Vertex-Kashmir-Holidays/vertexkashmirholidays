import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { canEditDriver, driversSelect } from "@/lib/bookings/driver";
import { sendDriverDetailsEmail } from "@/lib/bookings/notify";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import type { Role } from "@/lib/rbac";
import { z } from "zod";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const driverSchema = z.object({
  driverName: z.string().trim().min(2, "Driver name is required").max(100),
  driverPhone: z
    .string()
    .trim()
    .min(7, "A valid driver phone is required")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Driver phone may only contain digits and + - ( )"),
  vehicleNumber: z.string().trim().min(4, "Vehicle number is required").max(20),
  vehicleName: z.string().trim().min(2, "Vehicle name is required").max(60),
});

// The whole list each time (one entry per vehicle) — it replaces what's saved.
const schema = z.object({
  drivers: z.array(driverSchema).min(1, "Add at least one driver").max(10),
  sendEmail: z.boolean().optional().default(false),
});

/** Add or update the assigned drivers/vehicles for a locked booking. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null, ...(await bookingWhereForUser(role, userId)) },
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

  // Authoritative cutoff: no add/edit once the travel date has passed.
  if (!canEditDriver(booking.travelDate)) {
    return NextResponse.json(
      { error: "Driver details can only be changed on or before the travel date." },
      { status: 422 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { drivers, sendEmail } = parsed.data;

  const isUpdate = booking.driverAddedAt !== null;
  const saved = await prisma.$transaction(async (tx) => {
    await tx.bookingDriver.deleteMany({ where: { bookingId: id } });
    await tx.bookingDriver.createMany({
      data: drivers.map((d, i) => ({ ...d, bookingId: id, sortOrder: i })),
    });
    // Stamp the first time drivers are added; preserve on later edits.
    if (!isUpdate) {
      await tx.booking.update({ where: { id }, data: { driverAddedAt: new Date() } });
    }
    return tx.bookingDriver.findMany({ where: { bookingId: id }, ...driversSelect });
  });

  let emailed = false;
  if (sendEmail) {
    const { delivered } = await sendDriverDetailsEmail(id, { updated: isUpdate });
    emailed = delivered;
  }

  return NextResponse.json({ drivers: saved, emailed, requestedEmail: sendEmail });
}
