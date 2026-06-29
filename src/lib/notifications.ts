// Centralised in-app notifications (+ matching emails) for staff. Best-effort:
// every function swallows its own errors so a failed notification/email can never
// break the business action that triggered it (lead assignment, etc.).

import { prisma } from "@/lib/prisma";
import {
  sendMail,
  leadAssignedHtml,
  leadAssignedText,
  leadUnassignedHtml,
  leadUnassignedText,
  type LeadAssignmentData,
} from "@/lib/mail";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "https://vertexkashmirholidays.com"
  ).replace(/\/$/, "");
}

const fmtDate = (d: Date | null | undefined): string | null =>
  d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

/** Persist a single in-app notification. Never throws. */
export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    console.error("[notifications] create failed", err);
  }
}

export interface LeadForNotify {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  category?: string | null;
  startDate?: Date | null;
}

async function assigneeContact(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, deletedAt: true },
  });
}

function assignmentEmailData(
  assigneeName: string,
  lead: LeadForNotify,
  actorName: string,
): LeadAssignmentData {
  return {
    assigneeName,
    leadName: lead.name,
    leadPhone: lead.phone,
    leadEmail: lead.email ?? null,
    category: lead.category ?? null,
    travelDate: fmtDate(lead.startDate),
    actorName,
    leadUrl: `${siteUrl()}/admin/leads/${lead.id}`,
  };
}

/** Notify a staff member that a lead has been assigned to them (in-app + email). */
export async function notifyLeadAssigned(
  assigneeId: string,
  lead: LeadForNotify,
  actorName: string,
): Promise<void> {
  const user = await assigneeContact(assigneeId).catch(() => null);
  if (!user || user.deletedAt) return;
  const assigneeName = user.name ?? user.email;

  await createNotification({
    userId: assigneeId,
    type: "LEAD_ASSIGNED",
    title: "New lead assigned to you",
    body: `${lead.name} · ${lead.phone}${lead.category ? ` · ${lead.category}` : ""}`,
    link: `/admin/leads/${lead.id}`,
  });

  try {
    await sendMail({
      to: user.email,
      subject: "A new lead has been assigned to you — Vertex Kashmir Holidays",
      html: leadAssignedHtml(assignmentEmailData(assigneeName, lead, actorName)),
      text: leadAssignedText(assignmentEmailData(assigneeName, lead, actorName)),
    });
  } catch (err) {
    console.error("[notifications] lead-assigned email failed", err);
  }
}

/**
 * Notify all SUPERADMIN, ADMIN, and SALES staff of a new direct website booking.
 * Called once per booking from finalizeOnlinePayment (idempotency guaranteed by caller).
 * Never throws.
 */
export async function notifyNewBooking(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        guestName: true,
        guestPhone: true,
        amount: true,
        travelDate: true,
        tour: { select: { title: true } },
      },
    });
    if (!booking) return;

    const staffUsers = await prisma.user.findMany({
      where: {
        role: { in: ["SUPERADMIN", "ADMIN", "SALES"] },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (staffUsers.length === 0) return;

    const tourTitle = booking.tour?.title ?? "Direct Booking";
    const travelDate = booking.travelDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const amount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(booking.amount);

    await Promise.all(
      staffUsers.map((u) =>
        createNotification({
          userId: u.id,
          type: "BOOKING_NEW",
          title: "New booking received",
          body: `${booking.guestName} · ${tourTitle} · ${amount} · Travel: ${travelDate}`,
          link: `/admin/bookings/${bookingId}`,
        }),
      ),
    );
  } catch (err) {
    console.error("[notifications] notifyNewBooking failed", err);
  }
}

/** Notify a staff member that a lead has been reassigned away from them. */
export async function notifyLeadUnassigned(
  assigneeId: string,
  lead: LeadForNotify,
  actorName: string,
): Promise<void> {
  const user = await assigneeContact(assigneeId).catch(() => null);
  if (!user || user.deletedAt) return;
  const assigneeName = user.name ?? user.email;

  await createNotification({
    userId: assigneeId,
    type: "LEAD_UNASSIGNED",
    title: "A lead was reassigned from you",
    body: `${lead.name} · ${lead.phone} is no longer assigned to you`,
    link: `/admin/leads/${lead.id}`,
  });

  try {
    await sendMail({
      to: user.email,
      subject: "A lead has been reassigned — Vertex Kashmir Holidays",
      html: leadUnassignedHtml(assignmentEmailData(assigneeName, lead, actorName)),
      text: leadUnassignedText(assignmentEmailData(assigneeName, lead, actorName)),
    });
  } catch (err) {
    console.error("[notifications] lead-unassigned email failed", err);
  }
}
