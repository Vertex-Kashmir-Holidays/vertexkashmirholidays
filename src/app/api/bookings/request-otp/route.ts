import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail, bookingOtpHtml, bookingOtpText } from "@/lib/mail";
import {
  OTP_TTL_MS,
  OTP_TTL_MINUTES,
  RESEND_COOLDOWN_MS,
  RESEND_COOLDOWN_SECONDS,
  cleanupExpiredOtps,
  generateOtp,
  hashOtp,
} from "@/lib/auth/otp";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/ratelimit";
import {
  EMAIL_FORMAT_MESSAGE,
  PUBLIC_DOMAINS_GENERIC_MESSAGE,
  isAllowedCustomerEmailDomain,
} from "@/lib/auth/validation";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  email: z.string().trim().email(EMAIL_FORMAT_MESSAGE).max(200),
});

// Step 1 of the booking-form email verification: enforce the public-provider
// domain allowlist (this is what rejects placeholder/fake addresses like
// you@example.com, and the staff company domain) and email a one-time code.
// No booking row is touched here — this only proves the guest owns the email
// before create-order will accept it.
export async function POST(req: NextRequest) {
  try {
    const ipLimit = await rateLimit(`otp-req:booking:${clientIp(req)}`, 10, "10 m");
    if (!ipLimit.success) {
      return tooManyRequests(ipLimit);
    }

    const body = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();

    if (!isAllowedCustomerEmailDomain(email)) {
      return NextResponse.json({ error: PUBLIC_DOMAINS_GENERIC_MESSAGE }, { status: 400 });
    }

    await cleanupExpiredOtps();

    // Enforce the 60-second resend cooldown per email.
    const pending = await prisma.emailOtp.findUnique({ where: { email } });
    if (pending) {
      const elapsed = Date.now() - pending.lastSentAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${retryAfter}s before requesting another code.`,
            retryAfter,
          },
          { status: 429 },
        );
      }
    }

    const code = generateOtp();
    const codeHash = await hashOtp(code);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    // Upsert resets attempts/verifiedAt/resetTokenHash, so a fresh code always
    // starts a clean verification state. Deliberately no booking fields written
    // here — this row only ever verifies the email.
    await prisma.emailOtp.upsert({
      where: { email },
      create: {
        email,
        codeHash,
        purpose: "BOOKING",
        expiresAt,
        lastSentAt: now,
        attempts: 0,
      },
      update: {
        codeHash,
        purpose: "BOOKING",
        expiresAt,
        lastSentAt: now,
        attempts: 0,
        verifiedAt: null,
        resetTokenHash: null,
      },
    });

    try {
      const result = await sendMail({
        to: email,
        subject: "Verify your email — Vertex Kashmir Holidays booking",
        html: bookingOtpHtml({ code, ttlMinutes: OTP_TTL_MINUTES }),
        text: bookingOtpText({ code, ttlMinutes: OTP_TTL_MINUTES }),
      });

      if (!result.delivered) {
        console.error("[bookings/request-otp] email not delivered", {
          email,
          skipped: result.skipped,
          rejected: result.rejected,
          response: result.response,
        });
        await prisma.emailOtp.delete({ where: { email } }).catch(() => {});
        return NextResponse.json(
          { error: "Could not send the verification code. Please try again." },
          { status: 502 },
        );
      }
    } catch (sendErr) {
      console.error("[bookings/request-otp] sendMail threw:", sendErr);
      await prisma.emailOtp.delete({ where: { email } }).catch(() => {});
      return NextResponse.json(
        { error: "Could not send the verification code. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: true, cooldown: RESEND_COOLDOWN_SECONDS, ttlMinutes: OTP_TTL_MINUTES },
      { status: 200 },
    );
  } catch (err) {
    console.error("[bookings/request-otp] error:", err);
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again." },
      { status: 500 },
    );
  }
}
