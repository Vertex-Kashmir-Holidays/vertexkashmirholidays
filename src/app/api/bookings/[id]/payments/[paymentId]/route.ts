import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { sendPaymentInvoiceEmail } from "@/lib/bookings/notify";
import { resolveGst } from "@/lib/payments/gst";
import { computeBookingFinance } from "@/lib/bookings/finance";
import type { PaymentType } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; paymentId: string }> };

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero.").optional(),
  type: z.enum(["TOKEN", "PARTIAL", "FINAL", "REFUND"]).optional(),
  method: z.string().trim().max(40).nullable().optional(),
  reference: z.string().trim().max(120).nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
  gstPercent: z.coerce.number().min(0).max(100).nullable().optional(),
});

async function loadBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      amount: true,
      discountType: true,
      discountValue: true,
      payments: { select: { id: true, amount: true, type: true, method: true, gstPercent: true } },
    },
  });
}

/** Edit a recorded payment (correct a wrong entry). Re-validates the balance cap. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id, paymentId } = await params;

  const booking = await loadBooking(id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const current = booking.payments.find((p) => p.id === paymentId);
  if (!current) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Resolve the effective values after the edit.
  const amount = d.amount ?? current.amount;
  const type = (d.type ?? current.type) as PaymentType;
  const method = d.method !== undefined ? d.method : current.method;
  const gstInput = d.gstPercent !== undefined ? d.gstPercent : current.gstPercent;

  // Balance cap: every collection (non-refund) must fit the remaining balance,
  // measured against all OTHER payments (this one's old amount is excluded).
  if (type !== "REFUND") {
    const others = booking.payments.filter((p) => p.id !== paymentId);
    const finance = computeBookingFinance({
      amount: booking.amount,
      discountType: booking.discountType,
      discountValue: booking.discountValue,
      payments: others,
      services: [],
    });
    if (amount > finance.balance) {
      return NextResponse.json(
        {
          error: `Payment (₹${amount.toLocaleString("en-IN")}) exceeds the remaining balance (₹${finance.balance.toLocaleString("en-IN")}).`,
        },
        { status: 422 },
      );
    }
  }

  // GST is server-authoritative: applied only to non-cash methods, recomputed here.
  const { gstPercent, gstAmount } = resolveGst(amount, gstInput, method);

  const updated = await prisma.bookingPayment.update({
    where: { id: paymentId },
    data: {
      amount,
      type,
      method: method ?? null,
      ...(d.reference !== undefined ? { reference: d.reference } : {}),
      ...(d.note !== undefined ? { note: d.note } : {}),
      gstPercent,
      gstAmount,
    },
  });

  // Re-send the corrected receipt (best-effort) so the customer's records match.
  const { delivered: emailed } = await sendPaymentInvoiceEmail(id, paymentId);

  return NextResponse.json({ ...updated, emailed });
}

/** Delete a recorded payment (wrongly added). Financials recompute from the ledger. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id, paymentId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, payments: { where: { id: paymentId }, select: { id: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.payments.length === 0)
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  await prisma.bookingPayment.delete({ where: { id: paymentId } });
  return NextResponse.json({ ok: true });
}
