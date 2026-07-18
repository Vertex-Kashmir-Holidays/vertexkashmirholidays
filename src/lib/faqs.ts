import { prisma } from "@/lib/prisma";
import type { FaqPlacement } from "@prisma/client";

// Collision-safe slug for the centralized Faq model — auto-generated from the
// question text (never user-typed), so unlike Tour/Blog's slug fields this
// needs to actively check for and resolve collisions rather than just relying
// on the DB's unique constraint to reject a duplicate, since migration/bulk
// imports can generate many slugs in one pass with no human in the loop to
// notice a P2002 error.
export async function generateFaqSlug(question: string, excludeId?: string): Promise<string> {
  const base = question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  let slug = base || "question";
  let suffix = 2;
  while (true) {
    const existing = await prisma.faq.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base || "question"}-${suffix}`;
    suffix += 1;
  }
}

export interface FaqPreviewItem {
  id: string;
  question: string;
  shortAnswer: string;
  slug: string;
}

// Short-answer preview list for Homepage/Tour/Destination/About/Contact — the
// same query shape everywhere, only the placement/relation filter changes.
// Never returns `answer` (the full text) — those pages must only ever render
// and schema-mark the short answer (see Faq.shortAnswer's doc comment).
export async function getFaqsForPlacement(
  placement: FaqPlacement,
  limit = 6,
): Promise<FaqPreviewItem[]> {
  const faqs = await prisma.faq.findMany({
    where: { status: "PUBLISHED", placements: { has: placement } },
    select: { id: true, question: true, shortAnswer: true, slug: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take: limit,
  });
  return faqs;
}
