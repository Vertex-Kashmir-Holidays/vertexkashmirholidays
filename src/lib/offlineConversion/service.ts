import { prisma } from "@/lib/prisma";
import type { OfflineConversion, OfflineConversionPlatform } from "@prisma/client";
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
 * assisted journey), then attempt each one immediately. Idempotent — the
 * (leadId, platform) unique constraint means calling this twice for the same
 * lead is a no-op via skipDuplicates.
 *
 * There is no scheduled cron sweep on the current Vercel plan (Hobby doesn't
 * support the frequency this needs), so enqueue time is the only trigger —
 * processRow() is called here directly instead of waiting for processPending().
 * A row that fails keeps whatever PENDING/FAILED state processRow() already
 * leaves it in; nothing re-attempts it until the cron is reinstated on Pro.
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

  const rows = await prisma.offlineConversion.findMany({
    where: { leadId, platform: { in: platforms }, status: "PENDING" },
  });
  for (const row of rows) {
    await processRow(row);
  }
}

/**
 * Enqueue offline-conversion upload rows for a directly-paid website Booking
 * (no Lead involved), then attempt each one immediately. Same guarantees as
 * enqueueForLead — see its comment for why processing happens here rather
 * than via a cron sweep.
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

  const rows = await prisma.offlineConversion.findMany({
    where: { bookingId, platform: { in: platforms }, status: "PENDING" },
  });
  for (const row of rows) {
    await processRow(row);
  }
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

/**
 * Attempts one queue row: builds its event, sends via the matching adapter,
 * and persists the outcome. Shared by the immediate enqueue-time attempt
 * (enqueueForLead/enqueueForBooking) and processPending() (the cron sweep —
 * currently unregistered on Hobby, kept intact for when Pro is available).
 */
async function processRow(row: OfflineConversion): Promise<"sent" | "failed"> {
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
    return "failed";
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
    return "sent";
  }

  await prisma.offlineConversion.update({
    where: { id: row.id },
    data: { status: "FAILED", attempts: { increment: 1 }, lastError: result.error ?? "Unknown error" },
  });
  return "failed";
}

/**
 * Processes up to `limit` pending/retryable rows. Called by the offline-
 * conversions cron route — not currently scheduled on the Vercel Hobby plan
 * (see vercel.json), so today this only runs if invoked manually. Kept fully
 * intact so re-adding the cron entry on Pro requires no implementation change.
 */
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
    const outcome = await processRow(row);
    if (outcome === "sent") sent++;
    else failed++;
  }

  return { processed: rows.length, sent, failed };
}
