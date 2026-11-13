import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendMail, leadNotificationHtml, leadNotificationText } from "@/lib/mail";
import { isValidE164Strict } from "@/lib/auth/phoneStrict.server";
import { phoneField } from "@/lib/leads/schema";
import { budgetBandKeyField, travelMonthField } from "@/lib/leads/qualification";
import { resolveQualification } from "@/lib/leads/budgetBands.server";
import { attributionSchema } from "@/lib/attribution";
import { deriveChannel, buildAttributionCreateInput } from "@/lib/attribution.server";
import {
  normalizeWhatsAppTokenParam,
  resolveWhatsAppAttributionToken,
} from "@/lib/whatsappAttribution.server";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/ratelimit";
import { isSameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

// Placeholder until sales learns the name on the first call/chat.
const NAME_PENDING = "WhatsApp visitor";

// Same "open conversation" set and window as POST /api/leads: a recent active
// lead for this phone means we already have them — no second row.
const ACTIVE_LEAD_STATUSES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONNECTED,
  LeadStatus.NOT_CONNECTED,
  LeadStatus.QUALIFIED,
  LeadStatus.NEGOTIATION,
];
const DUPLICATE_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

const bodySchema = z.object({
  phone: phoneField,
  budgetBandKey: budgetBandKeyField.optional(),
  travelMonth: travelMonthField,
  // The band came from the tour's price, not the visitor's choice.
  budgetDerived: z.boolean().optional(),
  // The visitor's WhatsApp Ref token (raw), when one was minted — its stored
  // attribution is server-side and preferred over the browser's copy.
  token: z.string().trim().max(64).optional(),
  attribution: attributionSchema.optional(),
  // Display context for the notes only — never trusted for anything else.
  page: z.string().trim().max(300).optional(),
  tourName: z.string().trim().max(200).optional(),
});

// Public: the WhatsApp popup's phone number becomes a CRM lead in the
// background as the visitor taps "Open WhatsApp" — so the enquiry is captured
// even if they never send the message. Fire-and-forget from the client; any
// failure here must never stand between the visitor and WhatsApp.
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = clientIp(req);
  const ipBurst = await rateLimit(`lead-wa:ip:burst:${ip}`, 5, "1 m");
  const ipHour = await rateLimit(`lead-wa:ip:hour:${ip}`, 20, "1 h");
  if (!ipBurst.success || !ipHour.success)
    return tooManyRequests(ipHour.success ? ipBurst : ipHour);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { phone, token, page, tourName, budgetDerived, ...answers } = parsed.data;

  if (!isValidE164Strict(phone)) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }
  const phoneLimit = await rateLimit(`lead-wa:phone:${phone}`, 3, "24 h");
  if (!phoneLimit.success) return tooManyRequests(phoneLimit);

  const recent = await prisma.lead.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true },
  });
  if (
    recent &&
    ACTIVE_LEAD_STATUSES.includes(recent.status) &&
    Date.now() - recent.createdAt.getTime() < DUPLICATE_WINDOW_MS
  ) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const normalized = token ? normalizeWhatsAppTokenParam(token) : null;
  const resolved = normalized ? await resolveWhatsAppAttributionToken(normalized) : null;
  const attribution = resolved?.attribution ?? parsed.data.attribution;
  const q = await resolveQualification(answers);

  const notes = [
    "📱 Left their number in the WhatsApp popup — may not have sent the message yet.",
    tourName ? `Tour: ${tourName}` : null,
    page ? `Page: ${page}` : null,
    normalized ? `WhatsApp Ref: ${normalized}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const lead = await prisma.lead.create({
    data: {
      name: NAME_PENDING,
      phone,
      source: deriveChannel(attribution),
      sourcePage: "whatsapp-popup",
      contactChannel: "WHATSAPP",
      notes,
      budgetBandKey: q.budgetBandKey,
      budgetBandLabel: q.budgetBandLabel,
      budgetBandDerived: !!q.budgetBandKey && !!budgetDerived,
      travelMonth: q.travelMonth,
      ...buildAttributionCreateInput(attribution, req),
    },
  });

  // Best-effort, after the commit — same inbox as the website forms.
  const leadsTo =
    env.LEADS_EMAIL ?? env.MAIL_TO_ADMIN ?? env.MAIL_FROM ?? "leads@vertexkashmirholidays.com";
  try {
    const submittedAt = lead.createdAt.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
    const mailData = {
      name: lead.name,
      phone: lead.phone,
      message: notes,
      source: "whatsapp-popup",
      leadId: lead.id,
      submittedAt,
    };
    await sendMail({
      to: leadsTo.replace(/[\r\n]+/g, " ").trim(),
      subject: `New WhatsApp popup lead (${lead.phone})`,
      html: leadNotificationHtml(mailData),
      text: leadNotificationText(mailData),
    });
  } catch (err) {
    console.error("[leads/whatsapp] notification email failed (lead saved):", lead.id, err);
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
