// B2B Communication — shared by the compose dialog (client) and the email
// route (server). No server-only imports here.

export const B2B_ATTACHMENT_MAX_BYTES = 3 * 1024 * 1024;
export const B2B_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;
export const B2B_ATTACHMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx";

/** Starting points for the compose form — staff edit them before sending. */
export const B2B_MESSAGE_TEMPLATES: { key: string; label: string; subject: string; message: string }[] = [
  {
    key: "offer",
    label: "Offer / new rates",
    subject: "Special partner offer from Vertex Kashmir Holidays",
    message:
      "We are pleased to share a special offer for our B2B partners.\n\n[Offer details — packages, validity, partner rates]\n\nThe attached sheet has the full details. Send us your requests through your partner account and our team will share a quote within 24 hours.",
  },
  {
    key: "update",
    label: "General update",
    subject: "Update from Vertex Kashmir Holidays",
    message: "We would like to share an update with all our B2B partners.\n\n[Your update]",
  },
  {
    key: "inactive",
    label: "No bookings — account reminder",
    subject: "Your B2B partner account — a gentle reminder",
    message:
      "We value our partnership and noticed that we have not received bookings from your agency for some time.\n\nOur team is ready to support you with competitive partner rates, quick quotes and on-ground service across Kashmir and Ladakh. If there is anything we can do to help you close more trips — rates, itineraries or marketing material — just reply to this email.\n\nPlease note: as per our partnership terms, partner accounts with no active requests or bookings for a long period may be made inactive. We would love to keep working with you.",
  },
  {
    key: "followup",
    label: "Request follow-up (no update)",
    subject: "Follow-up on your B2B request",
    message:
      "We shared the itinerary and quote for the request above but have not heard back from you.\n\nPlease let us know if the guest would like to go ahead, needs changes, or has dropped the plan. If we do not hear from you, the request will be closed — closed requests count towards your partnership terms.",
  },
];

const fmt = (d: Date | string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

/** The "Regarding your request…" line a tagged request's email opens with. */
export function b2bRequestSummary(r: {
  name: string;
  days: number | null;
  adults: number;
  children: number | null;
  startDate: Date | string | null;
  createdAt: Date | string;
}): string {
  const bits = [
    r.days ? `${r.days} days` : null,
    `${r.adults + (r.children ?? 0)} pax`,
    fmt(r.startDate) ? `travel ${fmt(r.startDate)}` : null,
    `sent ${fmt(r.createdAt)}`,
  ].filter(Boolean);
  return `Regarding your request: ${r.name} (${bits.join(", ")})`;
}
