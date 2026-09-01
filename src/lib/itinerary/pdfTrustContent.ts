// Real trust signals for the itinerary PDF.
//
// `rating` (HomeContent.aboutRatingTitle/Subtitle) is fetched fresh on every
// export and rendered directly — it's a single site-wide value, not
// per-itinerary content.
//
// `whyChoose` (WhyChooseItem) is different: per the itinerary editor spec, it
// must be editable per itinerary like everything else, so it actually lives
// in ItineraryData.whyChoose (same shape as `trust`), not fetched at export
// time. This module's `whyChoose` fetch + toItineraryWhyChoose() exist only
// to seed real content into a NEW itinerary or backfill an EXISTING one whose
// data.whyChoose is still empty (saved before this field existed) — see
// src/app/admin/itinerary/[id]/page.tsx.
import { prisma } from "@/lib/prisma";
import { genId, type TrustItem } from "@/types/itinerary";

export interface PdfTrustContent {
  rating: { title: string; subtitle: string; value: number | null } | null;
  whyChoose: { emoji: string; title: string; description: string }[];
}

// Distinct icons (from the shared ITINERARY_ICON_PATHS registry) assigned
// round-robin when seeding real WhyChooseItem rows into an itinerary — so
// every item gets a different icon out of the box instead of a repeated one.
// WhyChooseItem's own `emoji` field isn't usable here: react-pdf's standard
// Helvetica font has no emoji glyphs (same class of bug as the ₹ sign).
const WHY_CHOOSE_ICON_ROTATION = ["home", "medal", "star", "support"] as const;

export function toItineraryWhyChoose(
  items: { title: string; description: string }[],
): TrustItem[] {
  return items.map((item, i) => ({
    id: genId("wc"),
    title: item.title,
    subtitle: item.description,
    icon: WHY_CHOOSE_ICON_ROTATION[i % WHY_CHOOSE_ICON_ROTATION.length],
  }));
}

export async function getPdfTrustContent(): Promise<PdfTrustContent> {
  const [home, items] = await Promise.all([
    prisma.homeContent.findUnique({
      where: { id: "singleton" },
      select: { aboutRatingTitle: true, aboutRatingSubtitle: true },
    }),
    prisma.whyChooseItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
      select: { emoji: true, title: true, description: true },
    }),
  ]);

  const title = home?.aboutRatingTitle?.trim();
  const subtitle = home?.aboutRatingSubtitle?.trim();
  const rating =
    title && subtitle
      ? { title, subtitle, value: parseLeadingNumber(title) }
      : null;

  return { rating, whyChoose: items };
}

/** Pulls the first number out of a string like "★ 4.9 Google Rating" → 4.9. */
function parseLeadingNumber(text: string): number | null {
  const match = text.match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const n = parseFloat(match[1]);
  return Number.isFinite(n) ? n : null;
}
