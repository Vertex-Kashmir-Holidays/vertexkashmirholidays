import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  sendMail,
  bookingConfirmationHtml,
  bookingConfirmationText,
} from "@/lib/mail";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  // HMAC-SHA256 of "order_id|payment_id"
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET ?? "")
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(razorpay_signature, "hex");

  const isValid =
    expectedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, receivedBuf);

  const booking = await prisma.booking.findUnique({
    where: { razorpayOrderId: razorpay_order_id },
    include: { tour: { select: { title: true } } },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!isValid) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ success: false, status: "FAILED" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "PAID", razorpayPayId: razorpay_payment_id },
  });

  // Record the online payment in the shared booking payment ledger (idempotent on
  // the gateway payment id), so direct bookings use the same financial model.
  const alreadyRecorded = await prisma.bookingPayment.findFirst({
    where: { bookingId: booking.id, reference: razorpay_payment_id },
    select: { id: true },
  });
  if (!alreadyRecorded) {
    await prisma.bookingPayment.create({
      data: {
        bookingId: booking.id,
        amount: booking.amount,
        type: "FINAL",
        method: "razorpay",
        reference: razorpay_payment_id,
        note: "Online payment",
      },
    });
  }

  // Public WhatsApp number for the confirmation email (whatsapp → sitePhone),
  // matching the fallback used across the site (e.g. Footer).
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
    select: { whatsapp: true, sitePhone: true },
  });

  // Send confirmation email
  const tourTitle = booking.tour?.title ?? "Your Tour";
  if (booking.guestEmail) {
    const bookingEmail = {
      guestName: booking.guestName,
      tourTitle,
      amount: booking.amount,
      travelDate: booking.travelDate.toLocaleDateString("en-IN"),
      travellers: booking.travellers,
      razorpayPayId: razorpay_payment_id,
      whatsappNumber: settings?.whatsapp ?? settings?.sitePhone ?? null,
    };
    await sendMail({
      to: booking.guestEmail,
      subject: `Booking Confirmed — ${tourTitle} | Vertex Kashmir Holidays`,
      html: bookingConfirmationHtml(bookingEmail),
      text: bookingConfirmationText(bookingEmail),
    });
  }

  // WhatsApp notification stub
  const waMessage = encodeURIComponent(
    `New booking! Tour: ${tourTitle} | Guest: ${booking.guestName} | ₹${booking.amount} | PayID: ${razorpay_payment_id}`,
  );
  console.log(
    `[whatsapp] https://wa.me/${(process.env.MAIL_TO_ADMIN ?? "").replace(/\D/g, "")}?text=${waMessage}`,
  );

  return NextResponse.json({ success: true, status: updated.status });
}
