import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { MAX_VERIFY_ATTEMPTS, cleanupExpiredOtps, verifyOtpHash } from "@/lib/auth/otp";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(200),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

// Step 2 of the Careers apply-form email verification: verify the emailed
// code. Does not create or touch any candidate record — it proves email
// ownership and issues a one-time verification token (returned once, stored
// only as a bcrypt hash) that the real application-submit endpoint (a later
// ticket) must be presented before it accepts the application.
export async function POST(req: NextRequest) {
  try {
    const ipLimit = await rateLimit(`otp-verify:careers:${clientIp(req)}`, 30, "10 m");
    if (!ipLimit.success) {
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

    // Scoped to purpose: CAREERS so a stray register/reset OTP row for the
    // same email can never be verified here (and vice versa).
    const record = await prisma.emailOtp.findUnique({ where: { email } });
    if (!record || record.purpose !== "CAREERS") {
      return NextResponse.json(
        { error: "No verification in progress. Please request a new code." },
        { status: 400 },
      );
    }

    if (record.expiresAt < new Date()) {
      await prisma.emailOtp.delete({ where: { email } });
      return NextResponse.json(
        { error: "This code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      await prisma.emailOtp.delete({ where: { email } });
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new verification code." },
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

    // Code verified — issue a one-time verification token (shown once, stored
    // only as a bcrypt hash) and burn the code itself so it cannot be reused.
    const verificationToken = randomBytes(32).toString("hex");
    const resetTokenHash = await bcrypt.hash(verificationToken, 12);

    await prisma.emailOtp.update({
      where: { email },
      data: { verifiedAt: new Date(), resetTokenHash },
    });

    return NextResponse.json({ success: true, verificationToken }, { status: 200 });
  } catch (err) {
    console.error("[careers/apply/verify-otp] error:", err);
    return NextResponse.json(
      { error: "Could not verify the code. Please try again." },
      { status: 500 },
    );
  }
}
