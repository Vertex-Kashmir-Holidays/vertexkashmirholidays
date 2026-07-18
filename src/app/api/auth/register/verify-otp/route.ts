import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

// Step 2 of registration: validate the code against the pending EmailOtp row.
// On success the User account is created (the only place it is created) and the
// pending row is deleted so the code can never be reused.
export async function POST(req: NextRequest) {
  try {
    // Per-IP throttle on verification to slow brute-forcing across emails.
    const ipLimit = await rateLimit(`otp-verify:${clientIp(req)}`, 30, "10 m");
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

    const record = await prisma.emailOtp.findUnique({ where: { email } });
    if (!record || record.purpose !== "REGISTER") {
      return NextResponse.json(
        { error: "No verification in progress. Please request a new code." },
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
          error: "Too many incorrect attempts. Please request a new verification code.",
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

    // Guard against a race where an account was created since the OTP request.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.emailOtp.delete({ where: { email } });
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // A REGISTER row always has passwordHash set by request-otp — this guard is
    // purely for the type (the column is nullable because RESET rows don't use it).
    if (!record.passwordHash) {
      await prisma.emailOtp.delete({ where: { email } });
      return NextResponse.json(
        { error: "This verification is no longer valid. Please request a new code." },
        { status: 400 },
      );
    }

    // OTP verified — create the account (the single creation point) and burn the
    // code so it cannot be reused.
    const user = await prisma.user.create({
      data: {
        name: record.name ?? "",
        email,
        phone: record.phone,
        passwordHash: record.passwordHash,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await prisma.emailOtp.delete({ where: { email } });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err) {
    console.error("[verify-otp] error:", err);
    return NextResponse.json(
      { error: "Could not verify the code. Please try again." },
      { status: 500 },
    );
  }
}
