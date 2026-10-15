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
  email: string;
  name: string | null;
  agencyName: string | null;
}

/** Agents whose account is ACTIVE — the audience for "all agents" sends. */
export async function activeB2bRecipients(): Promise<B2bRecipient[]> {
  return prisma.user.findMany({
    where: { agencyStatus: "ACTIVE" },
    select: { email: true, name: true, agencyName: true },
    orderBy: { createdAt: "asc" },
  });
}

const contactNameOf = (r: B2bRecipient) => r.name?.trim() || r.agencyName?.trim() || "Partner";

// One email per agent (never a shared To/CC — agents must not see each other),
// a few at a time. Best-effort per recipient: one bad address doesn't stop the
// rest, and nothing here throws.
async function sendToEach(
  recipients: B2bRecipient[],
  build: (r: B2bRecipient) => { subject: string; html: string; text: string },
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

/** A message staff write themselves (Admin → B2B Agents → Email agents). */
export async function sendB2bAnnouncement(
  recipients: B2bRecipient[],
  subject: string,
  message: string,
): Promise<{ sent: number; failed: number }> {
  return sendToEach(recipients, (r) => {
    const data = { contactName: contactNameOf(r), subject, message };
    return { subject, html: b2bAnnouncementHtml(data), text: b2bAnnouncementText(data) };
  });
}
