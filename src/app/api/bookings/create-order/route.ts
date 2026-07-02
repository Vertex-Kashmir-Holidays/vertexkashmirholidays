import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { computeChargeable, round2, type PaymentOption } from "@/lib/bookings/finance";
import { logPaymentAudit } from "@/lib/bookings/audit";

// Booking business rules:
//   • A booking's travel date must be at least MIN_LEAD_DAYS away (lead time).
//   • A customer's next tour can only start BOOKING_GAP_DAYS after an existing
//     active booking's start date (trips are kept apart).
const MIN_LEAD_DAYS = 4;
const MAX_BOOKING_MONTHS = 6;
const BOOKING_GAP_DAYS = 15;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const orderSchema = z.object({
  tourId: z.string().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(6),
  travelDate: z.string().min(1),
  travellers: z.coerce.number().int().positive().max(50),
  // "ADVANCE" pays 10% now; "FULL" pays 100%. Server recomputes the amount.
  paymentOption: z.enum(["ADVANCE", "FULL"]).default("FULL"),
  address: z.string().trim().max(300).optional(),
  requirements: z.string().trim().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  // Rate-limit order creation per IP (defence against abuse / accidental spam).
  const limit = await rateLimit(`booking:order:${ip}`, 10, "10 m");
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a little while." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const {
    tourId,
    guestName,
    guestEmail,
    guestPhone,
    travelDate,
    travellers,
    paymentOption,
    address,
    requirements,
  } = parsed.data;

  const emailNorm = guestEmail.trim().toLowerCase();
  const travel = new Date(travelDate);
  if (Number.isNaN(travel.getTime())) {
    return NextResponse.json({ error: "Invalid travel date" }, { status: 400 });
  }
  // Minimum lead time: a booking's travel date must be at least MIN_LEAD_DAYS away.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const earliestTravel = new Date(todayStart);
  earliestTravel.setDate(earliestTravel.getDate() + MIN_LEAD_DAYS);
  if (travel < earliestTravel) {
    return NextResponse.json(
      {
        error: `Bookings must be made at least ${MIN_LEAD_DAYS} days in advance. Please choose a travel date on or after ${fmtDate(earliestTravel)}.`,
      },
      { status: 422 },
    );
  }

  const latestTravel = new Date(todayStart);
  latestTravel.setMonth(latestTravel.getMonth() + MAX_BOOKING_MONTHS);
  if (travel > latestTravel) {
    return NextResponse.json(
      { error: `Travel date cannot be more than ${MAX_BOOKING_MONTHS} months from today.` },
      { status: 422 },
    );
  }

  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { id: true, title: true, priceFrom: true, duration: true, minPersons: true, published: true },
  });

  if (!tour || !tour.published) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  if (travellers < tour.minPersons) {
    return NextResponse.json(
      { error: `This tour requires a minimum of ${tour.minPersons} traveller${tour.minPersons > 1 ? "s" : ""}.` },
      { status: 422 },
    );
  }

  // Duplicate-booking guard: block a second *paid/confirmed* booking for the same
  // email + tour + travel day. Abandoned PENDING orders don't block a retry.
  const dayStart = new Date(travel);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const duplicate = await prisma.booking.findFirst({
    where: {
      tourId,
      guestEmail: emailNorm,
      status: { in: ["CONFIRMED", "PAID"] },
      travelDate: { gte: dayStart, lt: dayEnd },
      deletedAt: null,
    },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      {
        error:
          "You already have a confirmed booking for this tour on this date. Please check your account, or contact us for changes.",
      },
      { status: 409 },
    );
  }

  // Spacing rule: the customer's next tour can only start BOOKING_GAP_DAYS after
  // an existing active booking's start date. Matched by the (verified) email, so
  // it applies whether they book signed-in or as a guest. An earlier, separate
  // trip (before the existing one) is allowed.
  const activeBookings = await prisma.booking.findMany({
    where: {
      guestEmail: emailNorm,
      status: { in: ["CONFIRMED", "PAID"] },
      deletedAt: null,
    },
    select: { travelDate: true, tour: { select: { duration: true } } },
  });
  for (const b of activeBookings) {
    // Gap is measured from end of trip (travelDate + duration) not just start.
    const tripEnd = new Date(b.travelDate);
    tripEnd.setDate(tripEnd.getDate() + (b.tour?.duration ?? 1));
    const earliestNext = new Date(tripEnd);
    earliestNext.setDate(earliestNext.getDate() + BOOKING_GAP_DAYS);
    if (travel >= b.travelDate && travel < earliestNext) {
      return NextResponse.json(
        {
          error: `You have an active trip ending ${fmtDate(tripEnd)}. Your next tour can start from ${fmtDate(earliestNext)} onwards (${BOOKING_GAP_DAYS} days after trip ends). Contact us if you need a different arrangement.`,
        },
        { status: 409 },
      );
    }
  }

  // ── Server-side amounts — NEVER trust the client ──────────────────────────
  // Booking total = per-person price × travellers. The online charge is the full
  // total, or a 10% advance, computed by the shared finance helper.
  const total = round2(tour.priceFrom * travellers);
  const option: PaymentOption = paymentOption;
  const chargeable = computeChargeable(total, option);
  const amountPaise = Math.round(chargeable * 100);

  if (chargeable <= 0) {
    return NextResponse.json({ error: "Invalid booking amount" }, { status: 400 });
  }

  if (
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID.includes("REPLACE_ME")
  ) {
    return NextResponse.json(
      { error: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_SECRET in .env." },
      { status: 503 },
    );
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_SECRET!,
  });

  const rzpOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `vkh_${Date.now()}`,
  });

  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Booking.amount stores the canonical TOTAL; the payment ledger records what was
  // actually charged. paymentOption records the customer's choice for display.
  const booking = await prisma.booking.create({
    data: {
      tourId,
      userId,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      paymentOption: option,
      travelDate: travel,
      travellers,
      guestName,
      guestEmail: emailNorm,
      guestPhone,
      address: address || null,
      requirements: requirements || null,
      status: "PENDING",
    },
    select: { id: true },
  });

  await logPaymentAudit({
    event: "ORDER_CREATED",
    bookingId: booking.id,
    orderId: rzpOrder.id,
    amount: chargeable,
    ip,
    detail: `option=${option} total=${total} travellers=${travellers}`,
  });

  return NextResponse.json({
    orderId: rzpOrder.id,
    amount: amountPaise,
    currency: "INR",
    bookingId: booking.id,
    paymentOption: option,
    total,
    chargeable,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
