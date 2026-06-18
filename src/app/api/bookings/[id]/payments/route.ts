import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import type { PaymentType } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  type: z.enum(["TOKEN", "PARTIAL", "FINAL", "REFUND"]).optional(),
  method: z.string().trim().max(40).nullable().optional(),
  reference: z.string().trim().max(120).nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
});

/** Record an additional payment against a booking (token/partial/final/refund). */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
  }
  const d = parsed.data;

  const created = await prisma.bookingPayment.create({
    data: {
      bookingId: id,
      amount: d.amount,
      type: (d.type ?? "PARTIAL") as PaymentType,
      method: d.method ?? null,
      reference: d.reference ?? null,
      note: d.note ?? null,
      recordedById: guard.user.id as string,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
