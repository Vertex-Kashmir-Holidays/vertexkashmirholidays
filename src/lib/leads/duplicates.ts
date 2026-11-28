import { NextResponse } from "next/server";
import type { LeadStatus, Prisma } from "@prisma/client";
import { LEAD_STATUS_LABELS } from "@/lib/leads/status";

// One customer = one open lead. Used by every lead create path (website form,
// WhatsApp popup, staff "New Lead") and by lead edits. B2B request leads are
// never matched — their phone belongs to the agent's guest.

/** A visitor enquiring again is blocked only while their lead is at one of
 *  these early stages; any other status lets a fresh lead through. */
export const VISITOR_BLOCKING_STATUSES: LeadStatus[] = ["NEW", "CONNECTED", "NOT_CONNECTED", "QUALIFIED"];

/** Staff can't add (or edit into) a second lead while one is still being worked. */
export const STAFF_BLOCKING_STATUSES: LeadStatus[] = [...VISITOR_BLOCKING_STATUSES, "NEGOTIATION"];

/** Last 10 digits — "+91 82477 97520" and "8247797520" are the same customer. */
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

/**
 * Serialises lead creation for one phone number until the surrounding
 * transaction ends, so two submissions at the same moment can't both pass the
 * duplicate check. Call first thing inside the create transaction.
 */
export async function lockLeadPhone(tx: Prisma.TransactionClient, phone: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`lead-phone:${phoneKey(phone)}`}))`;
}

/** The newest lead (not B2B) with this phone or email at one of `statuses`. */
export function findOpenDuplicateLead(
  db: Prisma.TransactionClient,
  opts: { phone: string; email?: string | null; statuses: LeadStatus[]; excludeId?: string },
) {
  const key = phoneKey(opts.phone);
  return db.lead.findFirst({
    where: {
      b2bAgentId: null,
      status: { in: opts.statuses },
      ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
      OR: [
        key.length === 10 ? { phone: { endsWith: key } } : { phone: opts.phone },
        ...(opts.email ? [{ email: { equals: opts.email, mode: "insensitive" as const } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, assignedTo: { select: { name: true, email: true } } },
  });
}

export type OpenDuplicateLead = NonNullable<Awaited<ReturnType<typeof findOpenDuplicateLead>>>;

export const leadRef = (id: string) => `#${id.slice(-8).toUpperCase()}`;

/** 409 for staff (create or edit): names the open lead, with its id so the
 *  form can offer "Open lead". */
export function duplicateLeadResponse(dup: OpenDuplicateLead) {
  const who = dup.assignedTo ? `, assigned to ${dup.assignedTo.name ?? dup.assignedTo.email}` : "";
  return NextResponse.json(
    {
      error: `This customer already has an open lead ${leadRef(dup.id)} (${LEAD_STATUS_LABELS[dup.status]}${who}). Update that lead instead.`,
      existingLeadId: dup.id,
    },
    { status: 409 },
  );
}
