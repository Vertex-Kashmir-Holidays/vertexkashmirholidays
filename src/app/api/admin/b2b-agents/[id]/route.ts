import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { sendB2bAgentActivationEmail } from "@/lib/b2b/notify";
import { agencyNameField, agencyStateField, parseAgencyLogo } from "@/lib/b2b/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// Only these two target states are settable through this route — PENDING is
// exclusively the state a new agent starts in (registration or CRM creation),
// never a transition target. Valid transitions:
//   PENDING   -> ACTIVE
//   ACTIVE    -> SUSPENDED
//   SUSPENDED -> ACTIVE
const patchSchema = z.object({
  agencyStatus: z.enum(["ACTIVE", "SUSPENDED"]),
});

// Detail edit — the same nine fields (and rules) as CRM creation in
// ../route.ts. The logo is optional here: omitted/empty keeps the current one.
const detailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().min(1, "Phone is required").max(40),
  agencyName: agencyNameField,
  agencyState: agencyStateField,
  agencyLogoDataUrl: z.string().max(690_000).optional().or(z.literal("")),
  agencyWebsite: z.string().trim().max(200).optional().or(z.literal("")),
  agencyRegistrationNumber: z.string().trim().max(100).optional().or(z.literal("")),
  agencyGstin: z.string().trim().max(30).optional().or(z.literal("")),
});

/**
 * Approve (PENDING/SUSPENDED -> ACTIVE) or suspend (ACTIVE -> SUSPENDED) a B2B
 * agent. Never deletes the User — historical Lead/Booking/Payment relationships
 * (once those exist, in a later phase) stay intact regardless of status.
 *
 * Every transition TO ACTIVE is the one point in a B2B agent's lifecycle where
 * real login credentials are generated and emailed — registration (public or
 * CRM-created) never sends a password, only this does, exactly the same
 * temp-password/mustChangePassword convention used for staff-created customer
 * accounts elsewhere in this codebase (see sendCustomerCredentialsEmail).
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("b2bAgents", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.agencyStatus === null) {
    return NextResponse.json({ error: "B2B agent not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // A body without agencyStatus is a detail edit, not a status change.
  if (!(body && typeof body === "object" && "agencyStatus" in body)) {
    return updateDetails(id, body);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { agencyStatus } = parsed.data;

  if (agencyStatus === existing.agencyStatus) {
    return NextResponse.json({ error: `Agent is already ${agencyStatus}` }, { status: 422 });
  }
  // SUSPENDED is only reachable from ACTIVE (suspending a PENDING application
  // isn't a real state — reject it with REJECTED-equivalent handling belongs to
  // a later phase alongside B2B requests, not here).
  if (agencyStatus === "SUSPENDED" && existing.agencyStatus !== "ACTIVE") {
    return NextResponse.json(
      { error: "Only an active agent can be suspended" },
      { status: 422 },
    );
  }

  const performedById = guard.user.id as string;
  const performedByName = (guard.user.name ?? guard.user.email) as string;

  // Precomputed outside the transaction — pure CPU-bound hashing, no DB
  // dependency, no reason to hold the transaction open for it.
  const activating = agencyStatus === "ACTIVE";
  const tempPassword = activating ? crypto.randomBytes(9).toString("base64url") : null;
  const passwordHash = tempPassword ? await bcrypt.hash(tempPassword, 12) : null;

  const updated = await prisma.$transaction(async (tx) => {
    const agent = await tx.user.update({
      where: { id },
      data: {
        agencyStatus,
        ...(passwordHash ? { passwordHash, mustChangePassword: true } : {}),
      },
      select: { id: true, name: true, email: true, agencyStatus: true, agencyName: true },
    });
    await tx.auditLog.create({
      data: {
        action: "B2B_AGENT_STATUS_CHANGE",
        targetUserId: id,
        targetUserName: existing.name,
        targetUserEmail: existing.email,
        performedById,
        performedByName,
        metadata: { fromStatus: existing.agencyStatus, toStatus: agencyStatus },
      },
    });
    return agent;
  });

  // Best-effort — never blocks/fails the status change itself, but the result
  // is returned so the UI can say when the credentials email didn't go out.
  let emailDelivered: boolean | null = null;
  if (tempPassword) {
    ({ delivered: emailDelivered } = await sendB2bAgentActivationEmail(
      updated.email,
      updated.name ?? "",
      updated.agencyName ?? updated.name ?? "",
      tempPassword,
    ));
  }

  return NextResponse.json({ ...updated, emailDelivered });
}

/**
 * Edit a B2B agent's details (any status). Email/phone stay unique across all
 * accounts, same as creation. Changing the email changes their login email —
 * the password is untouched.
 */
async function updateDetails(id: string, body: unknown) {
  const parsed = detailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;

  let agencyLogoUrl: string | undefined;
  if (data.agencyLogoDataUrl) {
    agencyLogoUrl = parseAgencyLogo(data.agencyLogoDataUrl) ?? undefined;
    if (!agencyLogoUrl) {
      return NextResponse.json(
        { error: { fieldErrors: { agencyLogoDataUrl: ["Logo must be a PNG or WebP image under 500KB."] } } },
        { status: 422 },
      );
    }
  }

  const [emailTaken, phoneTaken] = await Promise.all([
    prisma.user.findFirst({ where: { email: data.email, id: { not: id } }, select: { id: true } }),
    prisma.user.findFirst({ where: { phone: data.phone, id: { not: id } }, select: { id: true } }),
  ]);
  if (emailTaken) {
    return NextResponse.json({ error: "Another account already uses this email address." }, { status: 409 });
  }
  if (phoneTaken) {
    return NextResponse.json({ error: "Another account already uses this phone number." }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      agencyName: data.agencyName,
      agencyState: data.agencyState,
      // Optional fields: an emptied input clears the stored value.
      agencyWebsite: data.agencyWebsite || null,
      agencyRegistrationNumber: data.agencyRegistrationNumber || null,
      agencyGstin: data.agencyGstin || null,
      ...(agencyLogoUrl ? { agencyLogoUrl } : {}),
    },
    select: { id: true, name: true, email: true, agencyStatus: true, agencyName: true },
  });
  return NextResponse.json(updated);
}

/**
 * Delete a SUSPENDED B2B agent. Soft delete (sets deletedAt), same as the
 * staff Users screen's default — their Leads (onDelete: Restrict), Bookings
 * and commissions stay intact for history, the agent drops off the B2B Agents
 * list, and auth.ts already refuses logins for deleted users. Only suspended
 * agents can be deleted, so an active agent always has to be suspended first.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("b2bAgents", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.agencyStatus === null || existing.deletedAt) {
    return NextResponse.json({ error: "B2B agent not found" }, { status: 404 });
  }
  if (existing.agencyStatus !== "SUSPENDED") {
    return NextResponse.json(
      { error: "Only a suspended agent can be deleted" },
      { status: 422 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { deletedAt: new Date() } });
    await tx.auditLog.create({
      data: {
        action: "USER_SOFT_DELETE",
        targetUserId: id,
        targetUserName: existing.name,
        targetUserEmail: existing.email,
        performedById: guard.user.id as string,
        performedByName: (guard.user.name ?? guard.user.email) as string,
        metadata: { targetRole: existing.role, b2bAgent: true, agencyName: existing.agencyName },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
