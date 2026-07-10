import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/rbac";
import {
  MAX_VERIFY_ATTEMPTS,
  cleanupExpiredOtps,
  clientIp,
  rateLimit,
  verifyOtpHash,
} from "@/lib/auth/otp";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(200),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

// Step 2 of the forgot-password flow: verify the emailed code. This does NOT
// change the password yet — it proves email ownership and issues a one-time
// reset token (returned once, stored hashed) that the client must present to
// /forgot-password/reset-password along with the new password.
export async function POST(req: NextRequest) {
  try {
    // Per-IP throttle on verification to slow brute-forcing across emails.
    if (!rateLimit(`reset-otp-verify:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const { code } = parsed.data;

    await cleanupExpiredOtps();

    // Scoped to purpose: RESET so a stray registration OTP row for the same
    // email can never be verified here (and vice versa).
    const record = await prisma.emailOtp.findUnique({ where: { email } });
    if (!record || record.purpose !== "RESET") {
      return NextResponse.json(
        { error: "No password reset in progress. Please request a new code." },
        { status: 400 },
      );
    }

    // Expired → discard and ask for a fresh code.
    if (record.expiresAt < new Date()) {
      await prisma.emailOtp.delete({ where: { email } });
      return NextResponse.json(
        { error: "This code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Too many wrong attempts → lock this code out entirely.
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      await prisma.emailOtp.delete({ where: { email } });
      return NextResponse.json(
        {
          error:
            "Too many incorrect attempts. Please request a new verification code.",
        },
        { status: 429 },
      );
    }

    const valid = await verifyOtpHash(code, record.codeHash);
    if (!valid) {
      const updated = await prisma.emailOtp.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      const remaining = Math.max(0, MAX_VERIFY_ATTEMPTS - updated.attempts);
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Too many incorrect attempts. Please request a new verification code.",
          remaining,
        },
        { status: 400 },
      );
    }

    // Race guard: the account may have changed (soft-deleted, promoted to
    // staff) since the code was requested.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || isStaff(user.role)) {
      await prisma.emailOtp.delete({ where: { email } });
      return NextResponse.json(
        { error: "This account is no longer eligible for a password reset." },
        { status: 400 },
      );
    }

    // Code verified — issue a one-time reset token (shown once, stored only as
    // a bcrypt hash) and burn the code itself so it cannot be reused.
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenHash = await bcrypt.hash(resetToken, 12);

    await prisma.emailOtp.update({
      where: { email },
      data: { verifiedAt: new Date(), resetTokenHash },
    });

    return NextResponse.json({ success: true, resetToken }, { status: 200 });
  } catch (err) {
    console.error("[forgot-password/verify-otp] error:", err);
    return NextResponse.json(
      { error: "Could not verify the code. Please try again." },
      { status: 500 },
    );
  }
}
