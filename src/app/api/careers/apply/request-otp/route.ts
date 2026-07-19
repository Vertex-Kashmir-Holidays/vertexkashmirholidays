import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail, careersOtpHtml, careersOtpText } from "@/lib/mail";
import {
  OTP_TTL_MS,
  OTP_TTL_MINUTES,
  RESEND_COOLDOWN_MS,
  RESEND_COOLDOWN_SECONDS,
  cleanupExpiredOtps,
  generateOtp,
  hashOtp,
} from "@/lib/auth/otp";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { checkBotSignals, HONEYPOT_FIELD, TIMETRAP_FIELD } from "@/lib/security/formGuard";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(200),
  turnstileToken: z.string().optional(),
  [HONEYPOT_FIELD]: z.string().optional(),
  [TIMETRAP_FIELD]: z.coerce.number().optional(),
});

// Step 1 of the Careers apply-form email verification: request a 6-digit code.
// Unlike register/forgot-password, this is a public lead-capture-style form
// (no existing account involved), so it also runs the honeypot/time-trap check
// LeadForm/ContactForm use, not just Turnstile + rate limiting.
export async function POST(req: NextRequest) {
  try {
    const ipLimit = await rateLimit(`otp-req:careers:${clientIp(req)}`, 10, "10 m");
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);

    const bot = checkBotSignals(body);
    if (!bot.ok) {
      // Bots get a generic success response — no signal that they were caught.
      return NextResponse.json(
        { success: true, cooldown: RESEND_COOLDOWN_SECONDS, ttlMinutes: OTP_TTL_MINUTES },
        { status: 200 },
      );
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();

    const captchaOk = await verifyTurnstile(parsed.data.turnstileToken, clientIp(req));
    if (!captchaOk) {
      return NextResponse.json(
        { error: "Verification failed. Please refresh and try again." },
        { status: 403 },
      );
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
    // starts a clean verification state. Deliberately no candidate fields
    // (name/phone/etc.) written here — this row only ever verifies the email.
    await prisma.emailOtp.upsert({
      where: { email },
      create: {
        email,
        codeHash,
        purpose: "CAREERS",
        expiresAt,
        lastSentAt: now,
        attempts: 0,
      },
      update: {
        codeHash,
        purpose: "CAREERS",
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
        subject: "Verify your email — Vertex Kashmir Holidays application",
        html: careersOtpHtml({ code, ttlMinutes: OTP_TTL_MINUTES }),
        text: careersOtpText({ code, ttlMinutes: OTP_TTL_MINUTES }),
      });

      if (!result.delivered) {
        console.error("[careers/apply/request-otp] email not delivered", {
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
      console.error("[careers/apply/request-otp] sendMail threw:", sendErr);
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
    console.error("[careers/apply/request-otp] error:", err);
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again." },
      { status: 500 },
    );
  }
}
