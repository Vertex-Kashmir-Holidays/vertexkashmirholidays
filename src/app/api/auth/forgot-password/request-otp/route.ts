import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail, passwordResetOtpHtml, passwordResetOtpText } from "@/lib/mail";
import { isStaff } from "@/lib/rbac";
import {
  RESET_OTP_TTL_MS,
  RESET_OTP_TTL_MINUTES,
  RESEND_COOLDOWN_MS,
  RESEND_COOLDOWN_SECONDS,
  cleanupExpiredOtps,
  clientIp,
  generateOtp,
  hashOtp,
  rateLimit,
} from "@/lib/auth/otp";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(200),
  // Optional Turnstile token (verified only when TURNSTILE_SECRET_KEY is set).
  turnstileToken: z.string().optional(),
});

// Step 1 of the forgot-password flow: identify the account by email only (the
// new password is not collected until after the OTP is verified — see
// verify-otp and reset-password). Staff accounts are never reset here (they
// are reset by another admin via /api/users/[id]).
export async function POST(req: NextRequest) {
  try {
    // Coarse per-IP throttle: at most 10 code requests / 10 min from one IP.
    if (!rateLimit(`reset-otp-req:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
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

    const email = parsed.data.email.toLowerCase();

    // CAPTCHA (enforced only when TURNSTILE_SECRET_KEY is configured).
    const captchaOk = await verifyTurnstile(parsed.data.turnstileToken, clientIp(req));
    if (!captchaOk) {
      return NextResponse.json(
        { error: "Verification failed. Please refresh and try again." },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.deletedAt) {
      return NextResponse.json(
        { error: "No account exists with this email address." },
        { status: 404 },
      );
    }

    // Staff passwords are only reset by another admin (users:edit permission),
    // never through this self-service flow.
    if (isStaff(user.role)) {
      return NextResponse.json(
        { error: "This account can't be reset here. Please contact an administrator." },
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
    const expiresAt = new Date(now.getTime() + RESET_OTP_TTL_MS);

    // Upsert resets attempts/verifiedAt/resetTokenHash, so a fresh code always
    // starts a clean verification state.
    await prisma.emailOtp.upsert({
      where: { email },
      create: {
        email,
        codeHash,
        purpose: "RESET",
        expiresAt,
        lastSentAt: now,
        attempts: 0,
      },
      update: {
        codeHash,
        purpose: "RESET",
        expiresAt,
        lastSentAt: now,
        attempts: 0,
        verifiedAt: null,
        resetTokenHash: null,
      },
    });

    // Only report success if the SMTP server actually accepted the message.
    try {
      const result = await sendMail({
        to: email,
        subject: "Your Vertex Kashmir Holidays password reset code",
        html: passwordResetOtpHtml({ name: user.name ?? "there", code, ttlMinutes: RESET_OTP_TTL_MINUTES }),
        text: passwordResetOtpText({ name: user.name ?? "there", code, ttlMinutes: RESET_OTP_TTL_MINUTES }),
      });

      if (!result.delivered) {
        console.error("[forgot-password/request-otp] email not delivered", {
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
      console.error("[forgot-password/request-otp] sendMail threw:", sendErr);
      await prisma.emailOtp.delete({ where: { email } }).catch(() => {});
      return NextResponse.json(
        { error: "Could not send the verification code. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: true, cooldown: RESEND_COOLDOWN_SECONDS, ttlMinutes: RESET_OTP_TTL_MINUTES },
      { status: 200 },
    );
  } catch (err) {
    console.error("[forgot-password/request-otp] error:", err);
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again." },
      { status: 500 },
    );
  }
}
