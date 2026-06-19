import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"]).optional(),
  discountType: z.enum(["FLAT", "PERCENT"]).nullable().optional(),
  discountValue: z.coerce.number().min(0).optional(),
  inclusions: z.array(z.string().trim().min(1).max(120)).optional(),
  // Customer email — required before services can be locked (invoice destination).
  guestEmail: z.string().trim().email("Enter a valid email address").max(200).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      tour: { select: { title: true, slug: true, coverImage: true, priceFrom: true } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(booking);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.booking.findUnique({ where: { id }, select: { id: true, servicesLocked: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const { status, discountType, discountValue, inclusions, guestEmail } = parsed.data;

  // Discount and inclusions are part of the services sheet — blocked once locked.
  // guestEmail is contact info (not a service field), so it stays editable.
  const touchesServices = discountType !== undefined || discountValue !== undefined || inclusions !== undefined;
  if (touchesServices && existing.servicesLocked) {
    return NextResponse.json({ error: "Services are locked and cannot be changed." }, { status: 423 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status: status as BookingStatus } : {}),
      ...(discountType !== undefined ? { discountType } : {}),
      ...(discountValue !== undefined ? { discountValue } : {}),
      ...(inclusions !== undefined ? { inclusions: JSON.stringify(inclusions) } : {}),
      ...(guestEmail !== undefined ? { guestEmail } : {}),
    },
  });
  return NextResponse.json(updated);
}

/**
 * Delete a booking (admin). Soft delete by default (sets `deletedAt`, hiding it
 * from every listing/report while retaining the row + its payment/service
 * history). Pass `?permanent=1` to remove the row irreversibly — Prisma cascade
 * rules then delete its BookingPayment + BookingService rows (no orphans), and
 * any linked lead's `bookingId` is set null.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const existing = await prisma.booking.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permanent = new URL(req.url).searchParams.get("permanent") === "1";

  if (permanent) {
    // Cascade (schema onDelete) removes BookingPayment + BookingService rows and
    // nulls Lead.bookingId — the delete is atomic and leaves no orphans.
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ ok: true, mode: "permanent" });
  }

  if (existing.deletedAt) {
    return NextResponse.json({ error: "Booking is already deleted." }, { status: 422 });
  }
  await prisma.booking.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true, mode: "soft" });
}
