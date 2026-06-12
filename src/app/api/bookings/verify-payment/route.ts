import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail, bookingConfirmationHtml } from "@/lib/mail";

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

  // Send confirmation email
  await sendMail({
    to: booking.guestEmail,
    subject: `Booking Confirmed — ${booking.tour.title} | Vertex Kashmir Holidays`,
    html: bookingConfirmationHtml({
      guestName: booking.guestName,
      tourTitle: booking.tour.title,
      amount: booking.amount,
      travelDate: booking.travelDate.toLocaleDateString("en-IN"),
      travellers: booking.travellers,
      razorpayPayId: razorpay_payment_id,
    }),
  });

  // WhatsApp notification stub
  const waMessage = encodeURIComponent(
    `New booking! Tour: ${booking.tour.title} | Guest: ${booking.guestName} | ₹${booking.amount} | PayID: ${razorpay_payment_id}`,
  );
  console.log(
    `[whatsapp] https://wa.me/${(process.env.MAIL_TO_ADMIN ?? "").replace(/\D/g, "")}?text=${waMessage}`,
  );

  return NextResponse.json({ success: true, status: updated.status });
}
