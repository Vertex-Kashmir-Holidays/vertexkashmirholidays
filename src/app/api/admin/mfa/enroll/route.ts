import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireStaff } from "@/lib/permissions";
import { requiresMfa } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { encryptMfaSecret } from "@/lib/security/mfaCrypto";
import { generateMfaSecret, buildOtpauthUrl } from "@/lib/security/mfaTotp";

export const dynamic = "force-dynamic";

// Step 1 of MFA enrollment (SUPERADMIN/ADMIN only): generates a new TOTP
// secret, stores it encrypted as "pending" (mfaEnabledAt stays null until
// /confirm proves possession of the authenticator app), and returns a QR code
// + manual key. Re-enrollment is blocked once MFA is already enabled — use
// the admin-reset path (PATCH /api/users/[id] resetMfa) instead.
export async function POST() {
  const guard = await requireStaff();
  if (guard instanceof NextResponse) return guard;

  const role = guard.user.role;
  if (!requiresMfa(role)) {
    return NextResponse.json({ error: "MFA is not required for this account." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: guard.user.id },
    select: { email: true, mfaEnabledAt: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.mfaEnabledAt) {
    return NextResponse.json({ error: "MFA is already enabled on this account." }, { status: 400 });
  }

  const secretBase32 = generateMfaSecret();
  await prisma.user.update({
    where: { id: guard.user.id },
    data: { mfaSecret: encryptMfaSecret(secretBase32) },
  });

  const otpauthUrl = buildOtpauthUrl(secretBase32, user.email);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ qrDataUrl, manualKey: secretBase32 });
}
