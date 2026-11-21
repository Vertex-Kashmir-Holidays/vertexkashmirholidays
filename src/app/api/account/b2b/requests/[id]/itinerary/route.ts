import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { b2bLeadWhere } from "@/lib/b2b/leadScope";
import { itineraryDataSchema } from "@/types/itinerary";
import { DEFAULT_ITINERARY_DATA } from "@/components/admin/itinerary/default-data";
import { getPdfTrustContent } from "@/lib/itinerary/pdfTrustContent";
import { isB2bAgentWhiteLabelEligible } from "@/lib/b2b/whiteLabelEligibility";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Agent read of their own B2B request's itinerary — same shape and
 * published-only rule as the normal customer route
 * (src/app/api/account/bookings/[id]/itinerary/route.ts): only the version
 * CRM last PUBLISHED is visible, never in-progress edits. The agent's browser renders the PDF
 * client-side from this JSON using the existing @react-pdf/renderer pipeline
 * (ItineraryPdf.tsx / export-pdf.tsx) — no B2B template yet (later phase), no
 * server-side PDF generation or storage. Agents never write here — no POST/
 * PATCH on this resource, matching "agents cannot generate or modify
 * itineraries."
 */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.agencyStatus === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, ...b2bLeadWhere(session.user.id) },
    select: {
      itinerary: {
        select: { id: true, status: true, publishedTitle: true, publishedData: true, publishedAt: true },
      },
      b2bAgent: { select: { agencyName: true, agencyLogoUrl: true, phone: true, email: true } },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const itinerary = lead.itinerary;
  if (!itinerary || !itinerary.publishedAt) {
    return NextResponse.json({ error: "Itinerary is not available yet." }, { status: 404 });
  }

  const parsed = itineraryDataSchema.safeParse(itinerary.publishedData);
  const data = parsed.success ? parsed.data : DEFAULT_ITINERARY_DATA;
  const [trustContent, whiteLabel] = await Promise.all([
    getPdfTrustContent(),
    isB2bAgentWhiteLabelEligible(session.user.id),
  ]);

  return NextResponse.json({
    id: itinerary.id,
    title: itinerary.publishedTitle,
    status: itinerary.status,
    updatedAt: itinerary.publishedAt,
    data,
    trustContent,
    agent: lead.b2bAgent,
    whiteLabel,
  });
}
