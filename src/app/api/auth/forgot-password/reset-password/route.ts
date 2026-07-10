import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/rbac";
import { RESET_TOKEN_TTL_MS, clientIp, rateLimit } from "@/lib/auth/otp";
import { PASSWORD_MESSAGE, isValidPassword } from "@/lib/auth/validation";

export const dynamic = "force-dynamic";

const resetSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address").max(200),
    resetToken: z.string().min(1),
    newPassword: z.string().max(100).refine(isValidPassword, PASSWORD_MESSAGE),
    confirmPassword: z.string().max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

// Step 3 of the forgot-password flow: the final "set new password" call. Only
// reachable with the one-time resetToken issued by verify-otp — proof that
// this browser session already completed the OTP step for this email.
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`reset-password:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const { resetToken, newPassword } = parsed.data;

    const record = await prisma.emailOtp.findUnique({ where: { email } });
    if (!record || record.purpose !== "RESET" || !record.verifiedAt || !record.resetTokenHash) {
      return NextResponse.json(
        { error: "Please verify your email again before setting a new password." },
        { status: 400 },
      );
    }

    if (Date.now() - record.verifiedAt.getTime() > RESET_TOKEN_TTL_MS) {
      await prisma.emailOtp.delete({ where: { email } });
      return NextResponse.json(
        { error: "This verification has expired. Please start again." },
        { status: 400 },
      );
    }

    const tokenValid = await bcrypt.compare(resetToken, record.resetTokenHash);
    if (!tokenValid) {
      return NextResponse.json(
        { error: "Please verify your email again before setting a new password." },
        { status: 400 },
      );
    }

    // Final race guard: the account may have changed since verification.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || isStaff(user.role)) {
      await prisma.emailOtp.delete({ where: { email } });
      return NextResponse.json(
        { error: "This account is no longer eligible for a password reset." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        mustChangePassword: false,
      },
    });

    await prisma.emailOtp.delete({ where: { email } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[forgot-password/reset-password] error:", err);
    return NextResponse.json(
      { error: "Could not reset your password. Please try again." },
      { status: 500 },
    );
  }
}
