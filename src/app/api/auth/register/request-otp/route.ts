import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendMail, otpVerificationHtml, otpVerificationText } from "@/lib/mail";
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
import {
  EMAIL_FORMAT_MESSAGE,
  PASSWORD_MESSAGE,
  PHONE_MESSAGE,
  PUBLIC_DOMAINS_GENERIC_MESSAGE,
  isAllowedEmailDomain,
  isValidE164,
  isValidPassword,
} from "@/lib/auth/validation";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  name: z.string().trim().min(1, "Please enter your full name.").max(100),
  email: z.string().trim().email(EMAIL_FORMAT_MESSAGE).max(200),
  // Client sends an E.164 number (e.g. +919876543210) validated per country.
  phone: z.string().trim().refine(isValidE164, PHONE_MESSAGE),
  password: z.string().max(100).refine(isValidPassword, PASSWORD_MESSAGE),
  // Optional Turnstile token (verified only when TURNSTILE_SECRET_KEY is set).
  turnstileToken: z.string().optional(),
});

// Step 1 of registration: validate inputs, enforce domain allowlist + anti-spam,
// and email a one-time code. The account is NOT created here — only a pending
// EmailOtp row (with the password already hashed) is stored.
export async function POST(req: NextRequest) {
  try {
    // Coarse per-IP throttle: at most 10 code requests / 10 min from one IP.
    // Durable (Upstash-backed) — shared across serverless instances, unlike a
    // per-process in-memory counter.
    const ipLimit = await rateLimit(`otp-req:${clientIp(req)}`, 10, "10 m");
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase();
    const phone = parsed.data.phone;
    const { password } = parsed.data;

    // CAPTCHA (enforced only when TURNSTILE_SECRET_KEY is configured).
    const captchaOk = await verifyTurnstile(parsed.data.turnstileToken, clientIp(req));
    if (!captchaOk) {
      return NextResponse.json(
        { error: "Verification failed. Please refresh and try again." },
        { status: 403 },
      );
    }

    if (!isAllowedEmailDomain(email)) {
      return NextResponse.json({ error: PUBLIC_DOMAINS_GENERIC_MESSAGE }, { status: 400 });
    }

    // Already a real account? Don't start a verification flow.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
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
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    // Upsert resets attempts and lastSentAt, so a fresh code always starts clean.
    await prisma.emailOtp.upsert({
      where: { email },
      create: {
        email,
        codeHash,
        purpose: "REGISTER",
        name,
        passwordHash,
        phone,
        expiresAt,
        lastSentAt: now,
        attempts: 0,
      },
      update: {
        codeHash,
        purpose: "REGISTER",
        name,
        passwordHash,
        phone,
        expiresAt,
        lastSentAt: now,
        attempts: 0,
      },
    });

    // Only report success if the SMTP server actually accepted the message. If
    // sending fails (transport error or no accepted recipient), drop the pending
    // row so the user can retry immediately instead of hitting the cooldown.
    try {
      // Recipient is the email the visitor is registering with — never the admin
      // address. MAIL_TO_ADMIN is only for admin notifications (see inquiries).
      const result = await sendMail({
        to: email,
        subject: "Your Vertex Kashmir Holidays verification code",
        html: otpVerificationHtml({ name, code, ttlMinutes: OTP_TTL_MINUTES }),
        text: otpVerificationText({ name, code, ttlMinutes: OTP_TTL_MINUTES }),
      });

      if (!result.delivered) {
        console.error("[request-otp] email not delivered", {
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
      console.error("[request-otp] sendMail threw:", sendErr);
      await prisma.emailOtp.delete({ where: { email } }).catch(() => {});
      return NextResponse.json(
        { error: "Could not send the verification code. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, cooldown: RESEND_COOLDOWN_SECONDS }, { status: 200 });
  } catch (err) {
    console.error("[request-otp] error:", err);
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again." },
      { status: 500 },
    );
  }
}
