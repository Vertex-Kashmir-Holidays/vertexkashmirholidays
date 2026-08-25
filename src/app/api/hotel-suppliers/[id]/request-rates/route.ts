import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, requireExisting } from "@/lib/api/route-helpers";
import {
  sendMail,
  siteUrl,
  brandLogoUrl,
  hotelRateRequestText,
  hotelRateRequestHtml,
  HOTEL_RATE_REQUEST_SUBJECT,
  type HotelRateRequestData,
} from "@/lib/mail";
import { hotelDataSchema, rateNeedsRefresh } from "@/lib/hotelSuppliers/schema";

const bodySchema = z.object({
  to: z.string().email("Enter a valid email address"),
});

const SALES_FROM = "Vertex Kashmir Holidays Sales <sales@vertexkashmirholidays.com>";
const SALES_EMAIL = "sales@vertexkashmirholidays.com";
const BOOKINGS_EMAIL = "bookings@vertexkashmirholidays.com";
const CONTACT_EMAILS = `${BOOKINGS_EMAIL}, ${SALES_EMAIL}`;
const ADMIN_BCC = "admin@vertexkashmirholidays.com";

// Tourism registration certificate — attached to every rate request so the
// supplier can verify Vertex is a registered J&K tour operator.
const REG_PDF_PATH = path.join(process.cwd(), "public", "docs", "Department of Tourism.pdf");
const REG_PDF_FILENAME = "Vertex Kashmir - Tourism Registration.pdf";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission("hotelSuppliers", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const hotel = await requireExisting(() => prisma.hotelSupplier.findUnique({ where: { id } }));
  if (!hotel.ok) return hotel.response;

  const parsedData = hotelDataSchema.safeParse(hotel.data.data);
  const rate = parsedData.success ? parsedData.data.rate : null;

  // Re-check server-side — a disabled button on the client must not be the only guard.
  if (!rateNeedsRefresh(rate)) {
    return NextResponse.json(
      { error: "This hotel already has a current MAP rate on file — no request needed." },
      { status: 409 },
    );
  }

  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(bodySchema, body.data);
  if (!parsed.ok) return parsed.response;

  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });

  const emailData: HotelRateRequestData = {
    hotelName: hotel.data.hotelName,
    contactPerson: parsedData.success ? parsedData.data.property.contactPerson : null,
    senderName: guard.user.name ?? "Vertex Kashmir Holidays Sales Team",
    company: {
      tradeName: settings?.siteName ?? "Vertex Kashmir Holidays",
      legalName: settings?.legalName ?? null,
      phone: settings?.sitePhone ?? null,
      contactEmails: CONTACT_EMAILS,
      website: siteUrl(),
      gstNumber: settings?.gstNumber ?? null,
      tourismRegNumber: settings?.tourismRegNumber ?? null,
      address: settings?.siteAddress ?? null,
      logoUrl: brandLogoUrl(),
    },
  };
  const html = hotelRateRequestHtml(emailData);
  const text = hotelRateRequestText(emailData);

  // Best-effort — a missing/unreadable certificate file must never block the
  // email itself from going out.
  let regPdf: Buffer | null = null;
  try {
    regPdf = await readFile(REG_PDF_PATH);
  } catch (err) {
    console.error("[hotel-suppliers/request-rates] could not read registration PDF:", err);
  }

  const result = await sendMail({
    to: parsed.data.to,
    bcc: ADMIN_BCC,
    from: SALES_FROM,
    replyTo: SALES_EMAIL,
    subject: `${HOTEL_RATE_REQUEST_SUBJECT} — ${hotel.data.hotelName}`,
    html,
    text,
    attachments: regPdf
      ? [{ filename: REG_PDF_FILENAME, content: regPdf, contentType: "application/pdf" }]
      : undefined,
  });

  if (result.skipped) {
    return NextResponse.json({ error: "Email sending is not configured (SMTP not set up)." }, { status: 503 });
  }
  if (!result.delivered) {
    return NextResponse.json({ error: "Failed to send — please try again." }, { status: 502 });
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
}
