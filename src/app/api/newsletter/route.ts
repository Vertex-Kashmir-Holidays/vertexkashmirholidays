import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { checkBotSignals } from "@/lib/security/formGuard";
import { isSameOrigin } from "@/lib/security/origin";

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email required"),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  // Honeypot + time-trap. Generic response so bots learn nothing.
  if (!checkBotSignals(body).ok) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  // Per-IP throttle: a handful of subscribes per hour is plenty for a human.
  const ip = clientIp(req);
  const limit = await rateLimit(`newsletter:ip:${ip}`, 5, "1 h");
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const parsed = newsletterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
