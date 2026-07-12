import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";
import { sendMail, leadNotificationHtml, leadNotificationText } from "@/lib/mail";
import { requirePermission } from "@/lib/permissions";
import { leadInputSchema } from "@/lib/leads/schema";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { checkBotSignals } from "@/lib/security/formGuard";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { isSameOrigin } from "@/lib/security/origin";
import { maskPhone, maskEmail } from "@/lib/security/mask";
import { deriveChannel, buildAttributionCreateInput } from "@/lib/attribution.server";
import { LeadStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Lead statuses that represent an open, in-progress conversation. A recent
// active duplicate (same phone/email) is blocked; HOLD/REJECTED/CONVERTED are
// treated as closed and always allow a fresh enquiry. (We keep the existing
// 8-value enum and map onto it rather than renaming — see CRM module.)
const ACTIVE_LEAD_STATUSES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONNECTED,
  LeadStatus.NOT_CONNECTED,
  LeadStatus.QUALIFIED,
  LeadStatus.NEGOTIATION,
];

// A matching ACTIVE lead newer than this is treated as a live duplicate.
const DUPLICATE_WINDOW_DAYS = 15;

// Strips CR/LF (and surrounding whitespace) from any value placed into an email
// header, defeating header-injection attempts.
function stripHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

// Admin: list leads with pagination, optional filters, and role-scoped access.
export async function GET(req: NextRequest) {
  const guard = await requirePermission("leads", "view");
  if (guard instanceof NextResponse) return guard;

  const role = (guard.user as { role: string }).role;
  const userId = guard.user.id as string;
  const isAdminOrSuper = role === "SUPERADMIN" || role === "ADMIN";

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();
  const source = searchParams.get("source")?.trim();
  const assignedToId = searchParams.get("assignedToId")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const take = 30;
  const skip = (page - 1) * take;

  const where: Prisma.LeadWhereInput = {};
  // Non-admin users can only see their assigned leads — enforced server-side.
  if (!isAdminOrSuper) {
    where.assignedToId = userId;
  }
  if (status && status !== "ALL") where.status = status as Prisma.LeadWhereInput["status"];
  if (source && source !== "ALL") where.source = source as Prisma.LeadWhereInput["source"];
  if (isAdminOrSuper && assignedToId && assignedToId !== "ALL") {
    where.assignedToId = assignedToId;
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        source: true,
        category: true,
        adults: true,
        status: true,
        startDate: true,
        followUpAt: true,
        updatedAt: true,
        negotiatedAmount: true,
        tokenAmount: true,
        assignedToId: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdAt: true,
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({ leads, total, page, pages: Math.ceil(total / take) });
}

// Server-authoritative payload schema. Built on the SAME shared schema the
// client form uses (@/lib/leads/schema) so the two can never drift. Extended
// with the optional free-text message + legacy top-level date/travellers that
// the contact form historically sent. Object schemas strip unknown keys, so a
// forged `status`/`id`/`assignedToId` is dropped here (anti mass-assignment).
const leadServerSchema = leadInputSchema.extend({
  message: z.string().trim().max(2000).optional(),
  travelDate: z.string().max(40).optional(),
  travellers: z.coerce.number().int().positive().max(99).optional(),
});

// Builds the lead's notes from a free-text message plus any page context, so the
// CRM shows what the visitor was looking at when they enquired.
function composeNotes(
  message: string | undefined,
  context: { tourName?: string; destinationName?: string } | undefined,
): string | undefined {
  const parts: string[] = [];
  if (context?.tourName) parts.push(`Tour: ${context.tourName}`);
  if (context?.destinationName) parts.push(`Destination: ${context.destinationName}`);
  if (message) parts.push(message);
  return parts.length ? parts.join("\n") : undefined;
}

// Public: create a lead from any inquiry/contact form.
// No auth guard — called from hero, tour sidebar, contact page, and campaign pages.
export async function POST(req: NextRequest) {
  // Reject cross-site scripted POSTs (CSRF) before doing any work.
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ip = clientIp(req);

  // 1) Honeypot + time-trap. Generic message to the client; detail server-side.
  const signals = checkBotSignals(body);
  if (!signals.ok) {
    console.warn(`[leads] blocked bot signal (${signals.reason}) ip=${ip}`);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 400 },
    );
  }

  // 2) Per-IP burst limit (cheap work first, before validation/DB). Distinct
  // keys per window so the two counters never collide in the store.
  const ipBurst = await rateLimit(`lead:ip:burst:${ip}`, 8, "1 m");
  const ipHour = await rateLimit(`lead:ip:hour:${ip}`, 30, "1 h");
  if (!ipBurst.success || !ipHour.success) {
    console.warn(`[leads] rate-limited ip=${ip}`);
    return NextResponse.json(
      { error: "Too many requests. Please try again in a little while." },
      { status: 429 },
    );
  }

  // 3) Turnstile CAPTCHA (enforced only when TURNSTILE_SECRET_KEY is set).
  const turnstileToken =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).turnstileToken
      : undefined;
  const captchaOk = await verifyTurnstile(
    typeof turnstileToken === "string" ? turnstileToken : undefined,
    ip,
  );
  if (!captchaOk) {
    console.warn(`[leads] turnstile failed ip=${ip}`);
    return NextResponse.json(
      { error: "Verification failed. Please refresh and try again." },
      { status: 403 },
    );
  }

  const parsed = leadServerSchema.safeParse(body);
  if (!parsed.success) {
    // Field-level errors so the client can render them inline (Batch 5). Never
    // trust the client — this is the authoritative validation pass.
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: "Please check the highlighted fields and try again.", fieldErrors },
      { status: 400 },
    );
  }

  // Whitelist: read ONLY these fields. `agree` is guaranteed true by the schema
  // (mandatory consent); it is not persisted. Anything else the client sent was
  // already stripped by the object schema.
  const { name, phone, email, message, source, context, travelDate, travellers, attribution } =
    parsed.data;

  // Context-supplied date/travellers fill in when the top-level fields are absent.
  const effectiveDate = travelDate ?? context?.travelDate;
  const effectiveTravellers = travellers ?? context?.travellers;
  // Free-text page tag for campaign attribution (the enum captures the channel).
  const sourcePage = source;

  // 4) Per-identity throttle — cap repeated submissions from one phone/email
  // (max 3 / 24h each). Masked in logs.
  const phoneLimit = await rateLimit(`lead:phone:${phone}`, 3, "24 h");
  const emailLimit = email
    ? await rateLimit(`lead:email:${email}`, 3, "24 h")
    : { success: true, remaining: 3 };
  if (!phoneLimit.success || !emailLimit.success) {
    console.warn(
      `[leads] identity rate-limited phone=${maskPhone(phone)} email=${maskEmail(email)} ip=${ip}`,
    );
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  // ── Anti-junk / duplicate prevention ───────────────────────────────────────
  // Look up the most recent lead matching the normalized phone OR email. If it
  // is still ACTIVE and was created within the dedupe window, block the new
  // submission with a friendly message. Closed leads (HOLD/REJECTED/CONVERTED)
  // or stale active ones (older than the window) fall through and are allowed.
  const normalizedEmail = email || undefined;
  const recent = await prisma.lead.findFirst({
    where: {
      OR: [{ phone }, ...(normalizedEmail ? [{ email: normalizedEmail }] : [])],
    },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true },
  });

  if (recent && ACTIVE_LEAD_STATUSES.includes(recent.status)) {
    const ageMs = Date.now() - recent.createdAt.getTime();
    const withinWindow = ageMs < DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (withinWindow) {
      const settings = await getSiteSettings();
      const whatsapp = buildWhatsAppHref(
        settings?.whatsapp,
        "Hi! I recently submitted an enquiry and wanted to follow up.",
      );
      return NextResponse.json(
        {
          error:
            "Your query is already in progress — our team will reach out within 3 days. For anything urgent, message us on WhatsApp.",
          blocked: true,
          whatsapp,
        },
        { status: 409 },
      );
    }
  }

  const lead = await prisma.lead.create({
    data: {
      // name is sanitized (control chars stripped, trimmed) and phone is E.164,
      // both enforced by the shared schema; email is lowercased + trimmed.
      name,
      phone,
      email: email || undefined,
      source: deriveChannel(attribution),
      sourcePage,
      adults: effectiveTravellers ?? 1,
      startDate: effectiveDate ? new Date(effectiveDate) : undefined,
      notes: composeNotes(message, context),
      ...buildAttributionCreateInput(attribution, req),
    },
  });

  // Dedicated lead inbox; falls back to the admin/from address if unset.
  const leadsTo =
    process.env.LEADS_EMAIL ??
    process.env.MAIL_TO_ADMIN ??
    process.env.MAIL_FROM ??
    "leads@vertexkashmirholidays.com";

  const submittedAt = lead.createdAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const mailData = {
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? undefined,
    travelDate: effectiveDate,
    travellers: effectiveTravellers,
    message: lead.notes ?? undefined,
    source: sourcePage ?? source,
    leadId: lead.id,
    submittedAt,
  };

  // Email is best-effort and runs AFTER the DB commit: a mail failure must never
  // fail the visitor's request (the lead is already saved). The subject is the
  // header-injection vector, so any interpolated value is stripped of CR/LF
  // (name is already control-char-sanitized by the schema; this is defence in
  // depth). The HTML/text bodies are templated and escape every value.
  try {
    await sendMail({
      to: stripHeader(leadsTo),
      subject: stripHeader(`New lead from ${lead.name} (${lead.phone})`),
      html: leadNotificationHtml(mailData),
      text: leadNotificationText(mailData),
      replyTo: lead.email ? stripHeader(lead.email) : undefined,
    });
  } catch (err) {
    // Log only the lead id — never the phone/email — and move on.
    console.error("[leads] notification email failed (lead saved):", lead.id, err);
  }

  return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
}
