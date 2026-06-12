import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Read raw body BEFORE any JSON parsing so HMAC is computed on the exact bytes
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET ?? "")
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature, "hex");

  const isValid =
    expectedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, receivedBuf);

  if (!isValid) {
    return new Response("Invalid signature", { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = JSON.parse(rawBody) as { event: string; payload: any };

  const paymentEntity = event.payload?.payment?.entity;
  const orderId: string | undefined = paymentEntity?.order_id;
  const paymentId: string | undefined = paymentEntity?.id;

  if (!orderId) return new Response("OK", { status: 200 });

  const booking = await prisma.booking.findUnique({
    where: { razorpayOrderId: orderId },
  });

  if (!booking) return new Response("OK", { status: 200 });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "PAID",
        razorpayPayId: paymentId ?? booking.razorpayPayId,
      },
    });
  } else if (event.event === "payment.failed") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "FAILED" },
    });
  }

  return new Response("OK", { status: 200 });
}
