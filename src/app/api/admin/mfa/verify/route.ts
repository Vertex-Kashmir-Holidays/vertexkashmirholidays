import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireStaff } from "@/lib/permissions";
import { requiresMfa } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { decryptMfaSecret } from "@/lib/security/mfaCrypto";
import { verifyTotp } from "@/lib/security/mfaTotp";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Accepts either a 6-digit TOTP code or a recovery code (XXXX-XXXX-XXXX).
const bodySchema = z.object({
  code: z.string().trim().max(20),
});

// The login-time MFA challenge for an already-enrolled SUPERADMIN/ADMIN. Tries
// the code as TOTP first, then falls back to unused recovery codes. This is
// the actual brute-force surface on a 6-digit code, so it's rate-limited by
// user id (they've already proven the password; this is the second factor).
export async function POST(req: NextRequest) {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const role = guard.user.role;
  if (!requiresMfa(role)) {
    return NextResponse.json({ error: "MFA is not required for this account." }, { status: 403 });
  }

  const limit = await rateLimit(`mfa-verify:${guard.user.id}`, 10, "10 m");
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your code." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: guard.user.id },
    select: { email: true, mfaSecret: true, mfaEnabledAt: true },
  });
  if (!user?.mfaEnabledAt || !user.mfaSecret) {
    return NextResponse.json({ error: "MFA is not enabled on this account." }, { status: 400 });
  }

  const input = parsed.data.code.trim();

  if (/^\d{6}$/.test(input)) {
    const secretBase32 = decryptMfaSecret(user.mfaSecret);
    if (verifyTotp(secretBase32, input, user.email)) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  // Not TOTP-shaped — try it as a recovery code.
  const unusedCodes = await prisma.mfaRecoveryCode.findMany({
    where: { userId: guard.user.id, usedAt: null },
    select: { id: true, codeHash: true },
  });

  for (const rc of unusedCodes) {
    if (await bcrypt.compare(input, rc.codeHash)) {
      await prisma.mfaRecoveryCode.update({
        where: { id: rc.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json({ success: true, usedRecoveryCode: true });
    }
  }

  return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
}
