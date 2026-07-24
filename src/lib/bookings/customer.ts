import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Resolution result for the customer (User) tied to a lead conversion.
 *  - customerId: the linked/created customer's id, or null when none could be
 *    resolved (no match and no email to create a login-capable account).
 *  - created:    true only when a brand-new customer account was created here.
 *  - tempPassword: the plaintext temporary password for a freshly created
 *    account (so the caller can email default credentials). Null otherwise —
 *    never persisted in plaintext.
 */
export interface CustomerResolution {
  customerId: string | null;
  created: boolean;
  tempPassword: string | null;
}

/**
 * Resolve the customer (a `User` with role CUSTOMER) for a lead conversion.
 *
 * Matching order — avoids creating duplicate customers:
 *   1. Existing user by email (email is unique across all users).
 *   2. Existing CUSTOMER by phone (phone is not unique, so scoped to customers).
 *   3. Otherwise create a new CUSTOMER — only possible when an email is present,
 *      since email is the required, unique login key.
 *
 * Runs inside the conversion transaction so the lookup + create are atomic with
 * the booking/lead writes. Kept deliberately small and side-effect-free (no email
 * sending here) so it can be reused/extended independently.
 */
export async function resolveLeadCustomer(
  tx: Prisma.TransactionClient,
  lead: { name: string; email: string | null; phone: string },
): Promise<CustomerResolution> {
  const email = lead.email?.trim().toLowerCase() || null;
  const phone = lead.phone?.trim() || null;

  // 1. Existing user by email (unique).
  if (email) {
    const byEmail = await tx.user.findUnique({ where: { email }, select: { id: true } });
    if (byEmail) return { customerId: byEmail.id, created: false, tempPassword: null };
  }

  // 2. Existing customer by phone.
  if (phone) {
    const byPhone = await tx.user.findFirst({
      where: { phone, role: "CUSTOMER", deletedAt: null },
      select: { id: true },
    });
    if (byPhone) return { customerId: byPhone.id, created: false, tempPassword: null };
  }

  // 3. Create a new customer — requires an email (the unique login key + the
  //    invoice destination). Without one we cannot create a login-capable account.
  if (!email) return { customerId: null, created: false, tempPassword: null };

  const tempPassword = crypto.randomBytes(9).toString("base64url"); // ~12 url-safe chars
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const created = await tx.user.create({
    // mustChangePassword: the account ships with a system-generated temp password
    // emailed to the customer, so they must set their own on first login.
    data: {
      email,
      name: lead.name,
      phone,
      passwordHash,
      role: "CUSTOMER",
      mustChangePassword: true,
    },
    select: { id: true },
  });
  return { customerId: created.id, created: true, tempPassword };
}

/**
 * Ensure a direct (website) booking is linked to a customer account, mirroring
 * the Lead→Booking behaviour exactly (it reuses {@link resolveLeadCustomer}):
 *   - Already linked (logged-in booker)  → no-op, returns the existing id.
 *   - Existing customer by email/phone   → links the booking, no new account.
 *   - New email                          → creates a CUSTOMER with a temp
 *                                          password + mustChangePassword, links it.
 *
 * Runs in a transaction so the lookup/create + booking link are atomic. Returns a
 * temp password only when a brand-new account was created (so the caller can send
 * the welcome/credentials email). Idempotent — calling twice for an already-linked
 * booking creates nothing.
 */
export async function linkBookingCustomer(bookingId: string): Promise<CustomerResolution> {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true, guestName: true, guestEmail: true, guestPhone: true },
    });
    if (!booking) return { customerId: null, created: false, tempPassword: null };

    // Already linked (e.g. the customer booked while signed in).
    if (booking.userId) {
      return { customerId: booking.userId, created: false, tempPassword: null };
    }

    // Self-service bookings match STRICTLY by email (the unique, verified login
    // key) — never by phone. Phone is not unique, so a phone match could link a
    // booking to a different customer's account (cross-account leak). The lead
    // conversion flow (resolveLeadCustomer) keeps phone matching because a staff
    // member has vetted that it's the same person; a public booking has not.
    const email = booking.guestEmail?.trim().toLowerCase() || null;
    if (!email) {
      // No email → cannot create a login-capable account; leave as a guest booking.
      return { customerId: null, created: false, tempPassword: null };
    }

    const existing = await tx.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      await tx.booking.update({ where: { id: bookingId }, data: { userId: existing.id } });
      return { customerId: existing.id, created: false, tempPassword: null };
    }

    // No account with this email → create one with a temp password.
    const tempPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const created = await tx.user.create({
      data: {
        email,
        name: booking.guestName,
        phone: booking.guestPhone?.trim() || null,
        passwordHash,
        role: "CUSTOMER",
        mustChangePassword: true,
      },
      select: { id: true },
    });
    await tx.booking.update({ where: { id: bookingId }, data: { userId: created.id } });
    return { customerId: created.id, created: true, tempPassword };
  });
}
