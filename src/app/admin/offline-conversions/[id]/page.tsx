import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import type { Role } from "@/lib/rbac";
import { getPlatformDestinationId } from "@/lib/admin/offlineConversionsServer";
import { OfflineConversionDetail } from "@/components/admin/offlineConversions/OfflineConversionDetail";

export const metadata: Metadata = { title: "Offline Conversion Detail — Admin" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function OfflineConversionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth();
  const role = (session?.user?.role ?? "ADMIN") as Role;
  const canRetry = await can(role, "offlineConversions", "edit");

  const row = await prisma.offlineConversion.findUnique({
    where: { id },
    select: {
      id: true,
      leadId: true,
      bookingId: true,
      platform: true,
      status: true,
      attempts: true,
      lastError: true,
      platformResponse: true,
      sentAt: true,
      createdAt: true,
      updatedAt: true,
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          gclid: true,
          gbraid: true,
          wbraid: true,
          fbclid: true,
          msclkid: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          landingPage: true,
          referrer: true,
          negotiatedAmount: true,
          source: true,
          status: true,
        },
      },
      booking: {
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          guestPhone: true,
          gclid: true,
          gbraid: true,
          wbraid: true,
          fbclid: true,
          msclkid: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          landingPage: true,
          referrer: true,
          amount: true,
          currency: true,
          status: true,
        },
      },
    },
  });

  if (!row) notFound();

  const destinationId = getPlatformDestinationId(row.platform);

  return <OfflineConversionDetail row={row} canRetry={canRetry} destinationId={destinationId} />;
}
