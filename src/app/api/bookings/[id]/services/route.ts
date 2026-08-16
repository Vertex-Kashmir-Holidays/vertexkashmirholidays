import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { serviceBodySchema } from "@/lib/bookings/service-schema";
import { round2 } from "@/lib/bookings/finance";
import { syncBookingCommission } from "@/lib/bookings/commissionSync";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import type { Role } from "@/lib/rbac";
import type { ServiceKind } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, ...bookingWhereForUser(role, userId) },
    select: {
      id: true,
      amount: true,
      servicesLocked: true,
      services: { select: { amount: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.servicesLocked) {
    return NextResponse.json(
      { error: "Services are locked and cannot be changed." },
      { status: 423 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = serviceBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Combined services total must never exceed the booking amount.
  const existingTotal = booking.services.reduce((s, x) => s + x.amount, 0);
  const newTotal = round2(existingTotal + d.amount);
  if (newTotal > booking.amount) {
    return NextResponse.json(
      {
        error: `Services total (₹${newTotal.toLocaleString("en-IN")}) would exceed the booking amount (₹${booking.amount.toLocaleString("en-IN")}).`,
      },
      { status: 422 },
    );
  }

  const created = await prisma.bookingService.create({
    data: {
      bookingId: id,
      kind: d.kind as ServiceKind,
      name: d.name,
      amount: d.amount,
      location: d.location ?? null,
      nights: d.nights ?? null,
      roomType: d.roomType ?? null,
      pickup: d.pickup ?? null,
      dropoff: d.dropoff ?? null,
      timing: d.timing ?? null,
      sortOrder: d.sortOrder ?? 0,
    },
  });
  await syncBookingCommission(prisma, id);
  return NextResponse.json(created, { status: 201 });
}
