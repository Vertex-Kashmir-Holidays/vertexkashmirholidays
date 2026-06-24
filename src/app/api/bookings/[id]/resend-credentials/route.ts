import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { sendCustomerCredentialsEmail } from "@/lib/bookings/notify";
import { logPaymentAudit } from "@/lib/bookings/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Resend customer login credentials (admin). Stored passwords are bcrypt-hashed
 * and can't be recovered, so this resets the linked customer to a fresh temporary
 * password (forcing a change on next login) and emails it.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    select: {
      userId: true,
      guestName: true,
      guestEmail: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!booking.userId) {
    return NextResponse.json(
      { error: "No customer account is linked to this booking." },
      { status: 422 },
    );
  }

  const email = booking.user?.email ?? booking.guestEmail ?? null;
  const name = booking.user?.name || booking.guestName || "Guest";
  if (!email) {
    return NextResponse.json({ error: "No email on file for this customer." }, { status: 422 });
  }

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await prisma.user.update({
    where: { id: booking.userId },
    data: { passwordHash, mustChangePassword: true },
  });

  const sent = await sendCustomerCredentialsEmail(email, name, tempPassword);
  await logPaymentAudit({
    event: "CREDENTIALS_RESENT",
    status: sent.delivered ? "success" : "failed",
    bookingId: id,
    detail: `to ${email.replace(/(.{2}).*(@.*)/, "$1***$2")}`,
  });

  return NextResponse.json({ success: true, delivered: sent.delivered });
}
