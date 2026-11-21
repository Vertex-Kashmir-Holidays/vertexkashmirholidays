// Client-visible itinerary snapshot.
//
// Customers (account → bookings) and B2B agents (account → requests) only ever
// read `publishedData` / `publishedTitle`, never the live `data` staff are
// still editing — so a half-finished edit can't leak to them. Staff push the
// last SAVED version to clients with an explicit "Publish" in the editor.
import { prisma } from "@/lib/prisma";

export interface PublishResult {
  publishedAt: string;
}

/**
 * Copy the itinerary's current saved content into its client-visible snapshot.
 * Also lifts a still-DRAFT itinerary to SENT — publishing is what "sent to the
 * client" means (the B2B convert gate and CRM status read that). Never
 * downgrades SENT/CONFIRMED. Caller is responsible for access checks.
 */
export async function publishItinerary(id: string): Promise<PublishResult> {
  const current = await prisma.itinerary.findUniqueOrThrow({
    where: { id },
    select: { title: true, data: true, status: true },
  });
  const publishedAt = new Date();
  await prisma.itinerary.update({
    where: { id },
    data: {
      publishedTitle: current.title,
      publishedData: current.data ?? {},
      publishedAt,
      // Pin updatedAt to the same instant — otherwise @updatedAt would stamp
      // this write a few ms later and the itinerary would instantly read as
      // "unpublished changes" (see hasUnpublishedChanges).
      updatedAt: publishedAt,
      ...(current.status === "DRAFT" ? { status: "SENT" } : {}),
    },
  });
  return { publishedAt: publishedAt.toISOString() };
}

/** True when staff have saved changes since the last publish (or never published). */
export function hasUnpublishedChanges(updatedAt: Date, publishedAt: Date | null): boolean {
  return publishedAt == null || updatedAt.getTime() > publishedAt.getTime();
}
