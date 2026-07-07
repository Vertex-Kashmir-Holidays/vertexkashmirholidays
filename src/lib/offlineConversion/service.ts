import { prisma } from "@/lib/prisma";
import type { OfflineConversionPlatform } from "@prisma/client";
import { pickAttribution, type AttributionData } from "@/lib/attribution";
import type { ConversionEvent, PlatformAdapter } from "./types";
import { googleAdapter } from "./adapters/google";
import { metaAdapter } from "./adapters/meta";
import { microsoftAdapter } from "./adapters/microsoft";

// The CRM only ever calls the functions in this file — it never imports an
// adapter or references Google/Meta/Microsoft directly (see enqueueForLead /
// enqueueForBooking call sites in the lead-convert route and finalizeOnlinePayment).
const ADAPTERS: Record<OfflineConversionPlatform, PlatformAdapter> = {
  GOOGLE: googleAdapter,
  META: metaAdapter,
  MICROSOFT: microsoftAdapter,
};

const MAX_ATTEMPTS = 5;

function platformsFor(attribution: AttributionData): OfflineConversionPlatform[] {
  const platforms: OfflineConversionPlatform[] = [];
  if (attribution.gclid || attribution.gbraid || attribution.wbraid) platforms.push("GOOGLE");
  if (attribution.fbclid) platforms.push("META");
  if (attribution.msclkid) platforms.push("MICROSOFT");
  return platforms;
}

/**
 * Enqueue offline-conversion upload rows for a just-converted Lead (sales-
 * assisted journey). Idempotent — the (leadId, platform) unique constraint
 * means calling this twice for the same lead is a no-op via skipDuplicates.
 */
export async function enqueueForLead(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;
  const platforms = platformsFor(pickAttribution(lead));
  if (platforms.length === 0) return;

  await prisma.offlineConversion.createMany({
    data: platforms.map((platform) => ({ leadId, platform })),
    skipDuplicates: true,
  });
}

/**
 * Enqueue offline-conversion upload rows for a directly-paid website Booking
 * (no Lead involved). Idempotent, same guarantee as enqueueForLead.
 */
export async function enqueueForBooking(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;
  const platforms = platformsFor(pickAttribution(booking));
  if (platforms.length === 0) return;

  await prisma.offlineConversion.createMany({
    data: platforms.map((platform) => ({ bookingId, platform })),
    skipDuplicates: true,
  });
}

/**
 * Builds the platform-agnostic event for one queue row by reading attribution
 * + value from whichever record originated it: the Lead for sales-assisted
 * conversions, the Booking for direct website bookings. This is the one place
 * that implements "Lead-based bookings use Lead attribution; direct bookings
 * use Booking attribution."
 */
async function buildEvent(row: { leadId: string | null; bookingId: string | null }): Promise<ConversionEvent | null> {
  if (row.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: row.leadId } });
    if (!lead) return null;
    return {
      attribution: pickAttribution(lead),
      conversionValue: lead.negotiatedAmount ?? undefined,
      currency: "INR",
      conversionTime: lead.updatedAt,
      email: lead.email ?? undefined,
      phone: lead.phone,
      ipAddress: lead.ipAddress ?? undefined,
      userAgent: lead.userAgent ?? undefined,
    };
  }
  if (row.bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: row.bookingId } });
    if (!booking) return null;
    return {
      attribution: pickAttribution(booking),
      conversionValue: booking.amount,
      currency: booking.currency,
      conversionTime: booking.updatedAt,
      email: booking.guestEmail ?? undefined,
      phone: booking.guestPhone,
      ipAddress: booking.ipAddress ?? undefined,
      userAgent: booking.userAgent ?? undefined,
    };
  }
  return null;
}

/** Processes up to `limit` pending/retryable rows. Called by the offline-conversions cron route. */
export async function processPending(limit = 50): Promise<{ processed: number; sent: number; failed: number }> {
  const rows = await prisma.offlineConversion.findMany({
    where: {
      OR: [{ status: "PENDING" }, { status: "FAILED", attempts: { lt: MAX_ATTEMPTS } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const adapter = ADAPTERS[row.platform];
    const event = await buildEvent(row);

    if (!event || !adapter.isConfigured()) {
      await prisma.offlineConversion.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          attempts: { increment: 1 },
          lastError: !event ? "Originating Lead/Booking no longer exists" : `${row.platform} adapter not configured`,
        },
      });
      failed++;
      continue;
    }

    const result = await adapter.send(event);
    if (result.success) {
      await prisma.offlineConversion.update({
        where: { id: row.id },
        data: {
          status: "SENT",
          attempts: { increment: 1 },
          sentAt: new Date(),
          platformResponse: result.response ? JSON.stringify(result.response) : undefined,
          lastError: null,
        },
      });
      sent++;
    } else {
      await prisma.offlineConversion.update({
        where: { id: row.id },
        data: { status: "FAILED", attempts: { increment: 1 }, lastError: result.error ?? "Unknown error" },
      });
      failed++;
    }
  }

  return { processed: rows.length, sent, failed };
}
