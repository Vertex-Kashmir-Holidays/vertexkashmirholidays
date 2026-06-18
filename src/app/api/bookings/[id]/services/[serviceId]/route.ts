import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { serviceUpdateSchema } from "@/lib/bookings/service-schema";
import { round2 } from "@/lib/bookings/finance";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; serviceId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id, serviceId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, amount: true, servicesLocked: true, services: { select: { id: true, amount: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.servicesLocked) {
    return NextResponse.json({ error: "Services are locked and cannot be changed." }, { status: 423 });
  }
  const service = booking.services.find((s) => s.id === serviceId);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = serviceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
  }
  const d = parsed.data;

  // Re-check the cap with the new amount (others + this one).
  if (d.amount !== undefined) {
    const othersTotal = booking.services.filter((s) => s.id !== serviceId).reduce((s, x) => s + x.amount, 0);
    const newTotal = round2(othersTotal + d.amount);
    if (newTotal > booking.amount) {
      return NextResponse.json(
        {
          error: `Services total (₹${newTotal.toLocaleString("en-IN")}) would exceed the booking amount (₹${booking.amount.toLocaleString("en-IN")}).`,
        },
        { status: 422 },
      );
    }
  }

  const updated = await prisma.bookingService.update({
    where: { id: serviceId },
    data: {
      ...(d.kind !== undefined ? { kind: d.kind } : {}),
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.amount !== undefined ? { amount: d.amount } : {}),
      ...(d.location !== undefined ? { location: d.location } : {}),
      ...(d.nights !== undefined ? { nights: d.nights } : {}),
      ...(d.pickup !== undefined ? { pickup: d.pickup } : {}),
      ...(d.dropoff !== undefined ? { dropoff: d.dropoff } : {}),
      ...(d.timing !== undefined ? { timing: d.timing } : {}),
      ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id, serviceId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, servicesLocked: true, services: { select: { id: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.servicesLocked) {
    return NextResponse.json({ error: "Services are locked and cannot be changed." }, { status: 423 });
  }
  if (!booking.services.some((s) => s.id === serviceId)) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  await prisma.bookingService.delete({ where: { id: serviceId } });
  return NextResponse.json({ ok: true });
}
