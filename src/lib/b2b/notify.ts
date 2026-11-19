// B2B agent lifecycle notifications. Kept separate from
// src/lib/bookings/notify.tsx (scoped to booking notifications specifically)
// — this is an account-lifecycle email, not a booking one.
import { prisma } from "@/lib/prisma";
import {
  sendMail,
  b2bAgentActivationHtml,
  b2bAgentActivationText,
  b2bAnnouncementHtml,
  b2bAnnouncementText,
  b2bDocumentUpdateHtml,
  b2bDocumentUpdateSubject,
  b2bDocumentUpdateText,
  ADMIN_COPY,
  type MailAttachment,
} from "@/lib/mail";

/**
 * Sent exactly once per activation event — whenever a B2B agent's
 * agencyStatus transitions to ACTIVE (see PATCH /api/admin/b2b-agents/[id]).
 * Best-effort: never throws, matching every other transactional-email helper
 * in this codebase (a mail failure must never fail the underlying action).
 */
export async function sendB2bAgentActivationEmail(
  email: string,
  contactName: string,
  agencyName: string,
  tempPassword: string,
): Promise<{ delivered: boolean }> {
  try {
    const res = await sendMail({
      to: email,
      subject: "Your Vertex Kashmir Holidays B2B Partner account is active",
      bcc: ADMIN_COPY,
      html: b2bAgentActivationHtml({ contactName, agencyName, email, tempPassword }),
      text: b2bAgentActivationText({ contactName, agencyName, email, tempPassword }),
    });
    return { delivered: res.delivered };
  } catch (err) {
    console.error("[b2b/notify] agent activation email failed", err);
    return { delivered: false };
  }
}

// ── Partner updates (documents + staff announcements) ───────────────────────

export interface B2bRecipient {
  id?: string;
  email: string;
  name: string | null;
  agencyName: string | null;
}

/** Agents whose account is ACTIVE — the audience for "all agents" sends. */
export async function activeB2bRecipients(): Promise<B2bRecipient[]> {
  return prisma.user.findMany({
    where: { agencyStatus: "ACTIVE" },
    select: { id: true, email: true, name: true, agencyName: true },
    orderBy: { createdAt: "asc" },
  });
}

const contactNameOf = (r: B2bRecipient) => r.name?.trim() || r.agencyName?.trim() || "Partner";

// One email per agent (never a shared To/CC — agents must not see each other),
// a few at a time. Best-effort per recipient: one bad address doesn't stop the
// rest, and nothing here throws.
async function sendToEach(
  recipients: B2bRecipient[],
  build: (r: B2bRecipient) => {
    subject: string;
    html: string;
    text: string;
    attachments?: MailAttachment[];
  },
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  const BATCH = 5;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const results = await Promise.all(
      recipients.slice(i, i + BATCH).map(async (r) => {
        try {
          const res = await sendMail({ to: r.email, ...build(r) });
          return res.delivered;
        } catch (err) {
          console.error("[b2b/notify] partner update email failed", r.email, err);
          return false;
        }
      }),
    );
    for (const ok of results) {
      if (ok) sent++;
      else failed++;
    }
  }
  return { sent, failed };
}

/** Tells every ACTIVE agent that a new document is in their partner documents
 *  area — called when staff upload a file under the "B2B" docs category. */
export async function notifyB2bAgentsOfDocument(doc: {
  title: string;
  description: string;
}): Promise<{ sent: number; failed: number }> {
  const recipients = await activeB2bRecipients();
  return sendToEach(recipients, (r) => {
    const data = {
      contactName: contactNameOf(r),
      agencyName: r.agencyName ?? "",
      docTitle: doc.title,
      docDescription: doc.description,
    };
    return {
      subject: b2bDocumentUpdateSubject(doc.title),
      html: b2bDocumentUpdateHtml(data),
      text: b2bDocumentUpdateText(data),
    };
  });
}

/** A document shared with one agent only (Admin → B2B Agents → Documents). */
export async function notifyB2bAgentOfDocument(
  agent: B2bRecipient,
  doc: { title: string; description: string },
): Promise<boolean> {
  const { sent } = await sendToEach([agent], (r) => {
    const data = {
      contactName: contactNameOf(r),
      agencyName: r.agencyName ?? "",
      docTitle: doc.title,
      docDescription: doc.description,
      personal: true,
    };
    return {
      subject: b2bDocumentUpdateSubject(doc.title, true),
      html: b2bDocumentUpdateHtml(data),
      text: b2bDocumentUpdateText(data),
    };
  });
  return sent > 0;
}

/** A message staff write themselves (Admin → B2B Agents → Email agents). */
export async function sendB2bAnnouncement(
  recipients: B2bRecipient[],
  subject: string,
  message: string,
  attachments?: MailAttachment[],
): Promise<{ sent: number; failed: number }> {
  return sendToEach(recipients, (r) => {
    const data = { contactName: contactNameOf(r), subject, message };
    return {
      subject,
      html: b2bAnnouncementHtml(data),
      text: b2bAnnouncementText(data),
      ...(attachments?.length ? { attachments } : {}),
    };
  });
}

// ── Request closed by staff ─────────────────────────────────────────────────

/** Tells the agent a request was closed, why, and how many closures their
 *  account now has. On the closure that reaches the limit the same email
 *  says the partnership is deactivated (admin gets a copy of that one). */
export async function sendB2bRequestClosedEmail(
  agent: B2bRecipient,
  request: { guestName: string; days: number | null; pax: number },
  reason: string,
  closedCount: number,
  limit: number,
  deactivated: boolean,
): Promise<{ delivered: boolean }> {
  const trip = [request.days ? `${request.days} days` : null, `${request.pax} pax`]
    .filter(Boolean)
    .join(", ");
  const subject = deactivated
    ? "Your Vertex Kashmir Holidays B2B partnership has been deactivated"
    : `B2B request closed — ${request.guestName}`;
  const message = [
    `We have closed your B2B request for ${request.guestName} (${trip}).`,
    `Reason: ${reason}`,
    "To help us quote quickly and accurately, please send only genuine, confirmed requests with complete details — guest name and contact number, travel dates, number of travellers and rooms, preferred hotel category and a realistic budget. Incomplete, duplicate or speculative requests take our team's time away from the bookings we are working on for you.",
    deactivated
      ? `With this, ${closedCount} of your requests have been closed. As per our partnership terms, your B2B partner account has now been deactivated and you will no longer be able to send new requests. Bookings already confirmed are not affected and our team will continue to service them.\n\nIf you would like to discuss reactivating your partnership, simply reply to this email.`
      : `Please note: as per our partnership terms, a partner account is deactivated after ${limit} closed requests. Your account now has ${closedCount} of ${limit}.\n\nIf you believe this request was closed by mistake, simply reply to this email.`,
  ].join("\n\n");
  const data = { contactName: contactNameOf(agent), subject, message };
  try {
    const res = await sendMail({
      to: agent.email,
      subject,
      ...(deactivated ? { bcc: ADMIN_COPY } : {}),
      html: b2bAnnouncementHtml(data),
      text: b2bAnnouncementText(data),
    });
    return { delivered: res.delivered };
  } catch (err) {
    console.error("[b2b/notify] request closed email failed", err);
    return { delivered: false };
  }
}
