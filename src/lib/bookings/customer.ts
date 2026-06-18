import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";

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
    data: { email, name: lead.name, phone, passwordHash, role: "CUSTOMER" },
    select: { id: true },
  });
  return { customerId: created.id, created: true, tempPassword };
}
