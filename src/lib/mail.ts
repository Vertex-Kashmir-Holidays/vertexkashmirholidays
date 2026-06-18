import nodemailer from "nodemailer";
import { buildWhatsAppHref } from "@/lib/whatsapp";

function createTransporter() {
  if (!process.env.SMTP_HOST) return null;

  const port = parseInt(process.env.SMTP_PORT ?? "465", 10);

  // Derive `secure` from the port so the two can never drift: only port 465 uses
  // implicit TLS (secure: true); 587/25 use STARTTLS (secure: false), which
  // Nodemailer negotiates automatically. SMTP_SECURE is intentionally no longer
  // read — the port is the single source of truth.
  const secure = port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Optional Reply-To (the From is always the no-reply sender). */
  replyTo?: string;
  /** Extra headers, merged over the transactional defaults. */
  headers?: Record<string, string>;
}

export interface SendMailResult {
  /** True only when at least one recipient was accepted by the SMTP server. */
  delivered: boolean;
  messageId?: string;
  accepted: string[];
  rejected: string[];
  response?: string;
  /** Set when SMTP is not configured (local-dev console fallback, no real send). */
  skipped?: boolean;
}

// Normalises nodemailer's Address[] | string[] result into plain emails.
function toEmails(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list.map((a) =>
    typeof a === "string" ? a : ((a as { address?: string })?.address ?? String(a)),
  );
}

export async function sendMail(options: MailOptions): Promise<SendMailResult> {
  const from =
    process.env.MAIL_FROM ??
    "Vertex Kashmir Holidays <noreply@vertexkashmirholidays.com>";

  const transporter = createTransporter();

  // No SMTP configured → local-dev console fallback. This does NOT send a real
  // email, so it reports delivered:false; callers that require delivery (e.g. the
  // OTP route) must check the result and fail accordingly.
  if (!transporter) {
    console.warn(
      "[mail] SMTP not configured (SMTP_HOST missing) — message NOT sent:",
      options.to,
      "|",
      options.subject,
    );
    return { delivered: false, skipped: true, accepted: [], rejected: [] };
  }

  // Transport-level failures (timeout, auth, TLS) reject here and propagate to
  // the caller — that is intentional.
  //
  // Transactional defaults that improve deliverability and stop auto-responders:
  //   • Auto-Submitted (RFC 3834) marks this as a system-generated message.
  //   • X-Auto-Response-Suppress tells Outlook/Exchange not to send OOO replies.
  // Per-call headers (options.headers) win over these defaults.
  const { headers: extraHeaders, replyTo, ...rest } = options;
  const info = await transporter.sendMail({
    from,
    replyTo: replyTo ?? process.env.MAIL_REPLY_TO,
    headers: {
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "All",
      ...extraHeaders,
    },
    ...rest,
  });

  const accepted = toEmails(info.accepted);
  const rejected = toEmails(info.rejected);
  const delivered = accepted.length > 0 && rejected.length === 0;

  console.log("[mail] send result", {
    to: options.to,
    messageId: info.messageId,
    accepted,
    rejected,
    response: info.response,
    delivered,
  });

  return {
    delivered,
    messageId: info.messageId,
    accepted,
    rejected,
    response: info.response,
  };
}

/**
 * Verifies the SMTP connection/credentials without sending a message. Useful for
 * diagnosing configuration. Returns a flag + human-readable message and never
 * throws or leaks credentials.
 */
export async function verifyTransport(): Promise<{
  ok: boolean;
  message: string;
}> {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      ok: false,
      message:
        "SMTP not configured (SMTP_HOST missing). Emails fall back to console logging.",
    };
  }
  try {
    await transporter.verify();
    return { ok: true, message: "SMTP connection verified successfully." };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "SMTP verification failed.",
    };
  }
}

// ── Reusable email builders ──────────────────────────────────────────────────

interface LeadNotificationData {
  name: string;
  phone: string;
  email?: string;
  travelDate?: string;
  travellers?: number;
  message?: string;
  source?: string;
}

export function leadNotificationText(data: LeadNotificationData): string {
  const lines = [
    "New lead — Vertex Kashmir Holidays",
    "",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
  ];
  if (data.email) lines.push(`Email: ${data.email}`);
  if (data.travelDate) lines.push(`Travel Date: ${data.travelDate}`);
  if (data.travellers) lines.push(`Travellers: ${data.travellers}`);
  if (data.source) lines.push(`Source: ${data.source}`);
  if (data.message) lines.push("", "Message:", data.message);
  return lines.join("\n");
}

export function leadNotificationHtml(data: LeadNotificationData): string {
  // Multi-line message: escape first, then turn newlines into <br /> so it reads.
  const messageRow = data.message
    ? `          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#666666;vertical-align:top"><strong>Message</strong></td>
            <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#222222;vertical-align:top">${escapeHtml(data.message).replace(/\n/g, "<br />")}</td>
          </tr>`
    : "";

  const content = `          <tr>
            <td style="padding:28px 28px 12px;font-family:Arial,Helvetica,sans-serif">
              <h1 style="margin:0;color:${BRAND};font-size:20px;font-weight:700">New Lead</h1>
              <p style="margin:6px 0 0;color:#666666;font-size:13px;line-height:1.5">A new enquiry was submitted on vertexkashmirholidays.com.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 28px 28px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #eeeeee">
${detailRow("Name", data.name)}
${detailRow("Phone", data.phone)}
${data.email ? detailRow("Email", data.email) : ""}
${data.travelDate ? detailRow("Travel Date", data.travelDate) : ""}
${data.travellers ? detailRow("Travellers", String(data.travellers)) : ""}
${data.source ? detailRow("Source", data.source) : ""}
${messageRow}
              </table>
            </td>
          </tr>`;

  return emailShell({
    title: "New Lead — Vertex Kashmir Holidays",
    preheader: `New lead from ${escapeHtml(data.name)} (${escapeHtml(data.phone)})`,
    contentHtml: content,
  });
}

interface BookingData {
  guestName: string;
  tourTitle: string;
  amount: number;
  travelDate: string;
  travellers: number;
  razorpayPayId: string;
  /** Public WhatsApp number (e.g. SiteSettings.whatsapp). Digits are extracted. */
  whatsappNumber?: string | null;
}

export function bookingConfirmationText(data: BookingData): string {
  const { text: waText } = resolveWhatsApp(data.whatsappNumber);
  return [
    "Booking Confirmed — Vertex Kashmir Holidays",
    "",
    `Dear ${data.guestName}, your booking is confirmed.`,
    "",
    `Tour: ${data.tourTitle}`,
    `Travel Date: ${data.travelDate}`,
    `Travellers: ${data.travellers}`,
    `Amount Paid: ₹${data.amount.toLocaleString("en-IN")}`,
    `Payment ID: ${data.razorpayPayId}`,
    "",
    "Our team will contact you within 24 hours with your complete itinerary details.",
    `WhatsApp us: ${waText}`,
  ].join("\n");
}

export function bookingConfirmationHtml(data: BookingData): string {
  const { href: waHref, text: waText } = resolveWhatsApp(data.whatsappNumber);

  const content = `          <tr>
            <td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif">
              <h1 style="margin:0 0 10px;color:${BRAND};font-size:20px;font-weight:700">Booking Confirmed</h1>
              <p style="margin:0;color:#444444;font-size:14px;line-height:1.6">Dear ${escapeHtml(data.guestName)}, your booking is confirmed. Here are your details:</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 4px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #eeeeee">
${detailRow("Tour", data.tourTitle)}
${detailRow("Travel Date", data.travelDate)}
${detailRow("Travellers", String(data.travellers))}
${detailRow("Amount Paid", `₹${data.amount.toLocaleString("en-IN")}`)}
${detailRow("Payment ID", data.razorpayPayId)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 28px;font-family:Arial,Helvetica,sans-serif">
              <p style="margin:0 0 16px;color:#444444;font-size:13px;line-height:1.6">Our team will contact you within 24 hours with your complete itinerary details.</p>
              <a href="${waHref}" style="display:inline-block;padding:11px 20px;border-radius:10px;background:${BRAND};color:#ffffff;font-size:13px;font-weight:700;text-decoration:none">WhatsApp us: ${escapeHtml(waText)}</a>
            </td>
          </tr>`;

  return emailShell({
    title: `Booking Confirmed — ${data.tourTitle}`,
    preheader: `Your booking for ${escapeHtml(data.tourTitle)} is confirmed.`,
    contentHtml: content,
  });
}

interface BookingInvoiceData {
  guestName: string;
  bookingRef: string;
  services: { kind: string; name: string }[]; // NO per-line pricing
  inclusions: string[];
  totalAmount: number; // effective payable (after discount)
  discountAmount: number;
  paidAmount: number;
  remainingBalance: number;
  status: string; // e.g. "Partial"
  whatsappNumber?: string | null;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function bookingInvoiceText(data: BookingInvoiceData): string {
  const { text: waText } = resolveWhatsApp(data.whatsappNumber);
  const lines = [
    "Booking Summary — Vertex Kashmir Holidays",
    "",
    `Dear ${data.guestName}, here is your booking summary.`,
    `Booking Ref: ${data.bookingRef}`,
    "",
    "Services included:",
    ...data.services.map((s) => `  • ${s.name} (${s.kind.toLowerCase()})`),
  ];
  if (data.inclusions.length) {
    lines.push("", "Inclusions:", ...data.inclusions.map((i) => `  • ${i}`));
  }
  lines.push(
    "",
    `Total Amount: ${inr(data.totalAmount)}`,
    `Discount: ${inr(data.discountAmount)}`,
    `Paid: ${inr(data.paidAmount)}`,
    `Remaining Balance: ${inr(data.remainingBalance)}`,
    `Status: ${data.status}`,
    "",
    `WhatsApp us: ${waText}`,
  );
  return lines.join("\n");
}

export function bookingInvoiceHtml(data: BookingInvoiceData): string {
  const { href: waHref, text: waText } = resolveWhatsApp(data.whatsappNumber);
  const serviceItems = data.services
    .map(
      (s) =>
        `<li style="margin:0 0 6px;color:#222222;font-size:13px">${escapeHtml(s.name)} <span style="color:#9aa0a6;font-size:11px">(${escapeHtml(s.kind.toLowerCase())})</span></li>`,
    )
    .join("");
  const inclusionItems = data.inclusions
    .map((i) => `<li style="margin:0 0 4px;color:#444444;font-size:12px">${escapeHtml(i)}</li>`)
    .join("");

  const content = `          <tr>
            <td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif">
              <h1 style="margin:0 0 10px;color:${BRAND};font-size:20px;font-weight:700">Booking Summary</h1>
              <p style="margin:0;color:#444444;font-size:14px;line-height:1.6">Dear ${escapeHtml(data.guestName)}, here is your booking summary. Ref: <strong>${escapeHtml(data.bookingRef)}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;font-family:Arial,Helvetica,sans-serif">
              <h2 style="margin:8px 0 6px;color:${BRAND};font-size:14px">Services</h2>
              <ul style="margin:0;padding-left:18px">${serviceItems || '<li style="color:#9aa0a6;font-size:12px">—</li>'}</ul>
              ${inclusionItems ? `<h2 style="margin:14px 0 6px;color:${BRAND};font-size:14px">Inclusions</h2><ul style="margin:0;padding-left:18px">${inclusionItems}</ul>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 4px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #eeeeee">
${detailRow("Total Amount", inr(data.totalAmount))}
${detailRow("Discount", inr(data.discountAmount))}
${detailRow("Paid", inr(data.paidAmount))}
${detailRow("Remaining Balance", inr(data.remainingBalance))}
${detailRow("Status", data.status)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 28px;font-family:Arial,Helvetica,sans-serif">
              <a href="${waHref}" style="display:inline-block;padding:11px 20px;border-radius:10px;background:${BRAND};color:#ffffff;font-size:13px;font-weight:700;text-decoration:none">WhatsApp us: ${escapeHtml(waText)}</a>
            </td>
          </tr>`;

  return emailShell({
    title: `Booking Summary — ${data.bookingRef}`,
    preheader: `Your booking summary — remaining balance ${inr(data.remainingBalance)}.`,
    contentHtml: content,
  });
}

// Escapes user-supplied values before they are interpolated into email HTML, so
// a name/message can never inject markup into the message.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Brand navy used across all emails.
const BRAND = "#0f3460";

/**
 * Shared, cross-client email chrome: a full HTML document with a centered white
 * card on a light background, a hidden preheader (the inbox preview snippet) and
 * an "automated message" footer. All transactional emails render through this so
 * they stay visually consistent and deliverability-friendly. `contentHtml` is the
 * inner `<tr>…</tr>` rows of the card body. `preheader` must be pre-escaped.
 */
function emailShell(opts: {
  title: string;
  preheader: string;
  contentHtml: string;
  maxWidth?: number;
}): string {
  const maxWidth = opts.maxWidth ?? 600;
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="https://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#f4f5f7">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f7">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${maxWidth}px;background:#ffffff;border-radius:14px;border:1px solid #e6e8eb">
${opts.contentHtml}
        </table>
        <p style="margin:16px 0 0;color:#9aa0a6;font-size:11px;font-family:Arial,Helvetica,sans-serif">
          This is an automated message from Vertex Kashmir Holidays.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** A label/value row for the detail tables. Both sides are HTML-escaped. */
function detailRow(label: string, value: string): string {
  return `          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#666666;white-space:nowrap;vertical-align:top"><strong>${escapeHtml(label)}</strong></td>
            <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#222222;vertical-align:top">${escapeHtml(value)}</td>
          </tr>`;
}

/** Resolves the WhatsApp click-to-chat link + label, with a contact-page fallback. */
function resolveWhatsApp(whatsappNumber?: string | null): {
  href: string;
  text: string;
} {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "https://vertexkashmirholidays.com";
  const waDigits = (whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return waDigits
    ? { href: buildWhatsAppHref(whatsappNumber), text: `+${waDigits}` }
    : { href: `${siteUrl}/contact`, text: "Contact us" };
}

/**
 * Plain-text part for the OTP email. A well-formed text alternative materially
 * improves inbox placement (multipart/alternative with a real text body looks
 * far less like spam than HTML-only).
 */
export function otpVerificationText(data: {
  name: string;
  code: string;
  ttlMinutes: number;
}) {
  return [
    `Hi ${data.name},`,
    "",
    "Use this code to finish creating your Vertex Kashmir Holidays account:",
    "",
    `    ${data.code}`,
    "",
    `This code expires in ${data.ttlMinutes} minutes and can be used only once.`,
    "If you didn't request this, you can ignore this email — no account will be created.",
    "",
    "— Vertex Kashmir Holidays",
    "https://vertexkashmirholidays.com",
  ].join("\n");
}

export function otpVerificationHtml(data: {
  name: string;
  code: string;
  ttlMinutes: number;
}) {
  const name = escapeHtml(data.name);
  const code = escapeHtml(data.code);
  // Hidden preheader: the preview line Gmail/Apple Mail show next to the subject.
  const preheader = `Your verification code is ${code} (expires in ${data.ttlMinutes} minutes).`;

  const content = `          <tr>
            <td style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif">
              <h1 style="margin:0 0 12px;color:${BRAND};font-size:20px;font-weight:700">Verify your email</h1>
              <p style="margin:0;color:#444444;font-size:14px;line-height:1.6">
                Hi ${name}, use the verification code below to finish creating your
                Vertex Kashmir Holidays account.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 32px 8px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:16px 28px;border-radius:12px;background:${BRAND};color:#ffffff;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:700;letter-spacing:8px">${code}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif">
              <p style="margin:16px 0 0;color:#666666;font-size:13px;line-height:1.6">
                This code expires in <strong>${data.ttlMinutes} minutes</strong> and can be
                used only once. If you didn't request this, you can safely ignore this
                email &mdash; no account will be created.
              </p>
            </td>
          </tr>`;

  return emailShell({
    title: "Verify your email",
    preheader,
    contentHtml: content,
    maxWidth: 480,
  });
}

// ── New-customer default credentials ───────────────────────────────────────────
// Sent when a lead is converted and a brand-new customer account is created. The
// customer can log in with these credentials and is encouraged to change the
// password. Only ever sent when an email is available (the unique login key).

interface CustomerCredentialsData {
  name: string;
  email: string;
  tempPassword: string;
  /** Absolute login URL; falls back to the site /login. */
  loginUrl?: string;
}

function resolveLoginUrl(loginUrl?: string): string {
  if (loginUrl) return loginUrl;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "https://vertexkashmirholidays.com";
  return `${siteUrl.replace(/\/$/, "")}/login`;
}

export function customerCredentialsText(data: CustomerCredentialsData): string {
  const loginUrl = resolveLoginUrl(data.loginUrl);
  return [
    "Your Vertex Kashmir Holidays account",
    "",
    `Dear ${data.name}, an account has been created for you so you can track your`,
    "bookings, payments and trip details online.",
    "",
    "Log in with these details:",
    `  Email: ${data.email}`,
    `  Temporary password: ${data.tempPassword}`,
    "",
    `Sign in: ${loginUrl}`,
    "",
    "For your security, please change this password after your first login.",
    "",
    "— Vertex Kashmir Holidays",
  ].join("\n");
}

export function customerCredentialsHtml(data: CustomerCredentialsData): string {
  const loginUrl = resolveLoginUrl(data.loginUrl);
  const content = `          <tr>
            <td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif">
              <h1 style="margin:0 0 10px;color:${BRAND};font-size:20px;font-weight:700">Your account is ready</h1>
              <p style="margin:0;color:#444444;font-size:14px;line-height:1.6">Dear ${escapeHtml(data.name)}, an account has been created for you so you can track your bookings, payments and trip details online.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 4px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid #eeeeee">
${detailRow("Email", data.email)}
${detailRow("Temporary Password", data.tempPassword)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 8px;font-family:Arial,Helvetica,sans-serif">
              <a href="${loginUrl}" style="display:inline-block;padding:11px 20px;border-radius:10px;background:${BRAND};color:#ffffff;font-size:13px;font-weight:700;text-decoration:none">Sign in to your account</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-family:Arial,Helvetica,sans-serif">
              <p style="margin:0;color:#666666;font-size:13px;line-height:1.6">For your security, please <strong>change this password</strong> after your first login.</p>
            </td>
          </tr>`;

  return emailShell({
    title: "Your Vertex Kashmir Holidays account",
    preheader: `Your account is ready — sign in with ${escapeHtml(data.email)}.`,
    contentHtml: content,
    maxWidth: 480,
  });
}
