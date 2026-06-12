import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const orderSchema = z.object({
  tourId: z.string().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(6),
  travelDate: z.string().min(1),
  travellers: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { tourId, guestName, guestEmail, guestPhone, travelDate, travellers } =
    parsed.data;

  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { id: true, title: true, priceFrom: true, published: true },
  });

  if (!tour || !tour.published) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  // Server-side price computation — never trust the client
  const amountRupees = tour.priceFrom;
  const amountPaise = Math.round(amountRupees * 100);

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

  const booking = await prisma.booking.create({
    data: {
      tourId,
      userId,
      razorpayOrderId: rzpOrder.id,
      amount: amountRupees,
      travelDate: new Date(travelDate),
      travellers,
      guestName,
      guestEmail,
      guestPhone,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    orderId: rzpOrder.id,
    amount: amountPaise,
    currency: "INR",
    bookingId: booking.id,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
