import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { requireStaff } from "@/lib/permissions";
import { requiresMfa } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { decryptMfaSecret } from "@/lib/security/mfaCrypto";
import { verifyTotp } from "@/lib/security/mfaTotp";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

const RECOVERY_CODE_COUNT = 8;

function generateRecoveryCode(): string {
  // 12 hex chars, grouped for readability: XXXX-XXXX-XXXX
  const hex = randomBytes(6).toString("hex").toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

// Step 2 of MFA enrollment: proves possession of the authenticator app by
// submitting a valid current code for the pending secret from /enroll. On
// success, enables MFA and issues one-time recovery codes (shown once, only
// their bcrypt hashes are ever stored).
export async function POST(req: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const role = guard.user.role;
  if (!requiresMfa(role)) {
    return NextResponse.json({ error: "MFA is not required for this account." }, { status: 403 });
  }

  const limit = await rateLimit(`mfa-confirm:${guard.user.id}`, 10, "10 m");
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: guard.user.id },
    select: { email: true, mfaSecret: true, mfaEnabledAt: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.mfaEnabledAt) {
    return NextResponse.json({ error: "MFA is already enabled on this account." }, { status: 400 });
  }
  if (!user.mfaSecret) {
    return NextResponse.json(
      { error: "No pending enrollment found. Please restart setup." },
      { status: 400 },
    );
  }

  const secretBase32 = decryptMfaSecret(user.mfaSecret);
  if (!verifyTotp(secretBase32, parsed.data.code, user.email)) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode);
  const recoveryCodeHashes = await Promise.all(recoveryCodes.map((code) => bcrypt.hash(code, 12)));

  await prisma.$transaction([
    prisma.user.update({
      where: { id: guard.user.id },
      data: { mfaEnabledAt: new Date() },
    }),
    prisma.mfaRecoveryCode.createMany({
      data: recoveryCodeHashes.map((codeHash) => ({ userId: guard.user.id, codeHash })),
    }),
  ]);

  return NextResponse.json({ success: true, recoveryCodes });
}
