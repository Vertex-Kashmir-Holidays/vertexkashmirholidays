import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { BUDGET_BANDS_TAG } from "@/lib/leads/budgetBands.server";
import { bandLabel } from "@/lib/leads/qualification";

// Admin input: only where a band STARTS (₹ per person) and whether it's
// active. Ends, labels and order are generated (recomputeActiveBands), so the
// active bands are always contiguous — no gaps, no overlaps, no label that
// disagrees with its range.
export const budgetBandInputSchema = z.object({
  minAmount: z.coerce.number().int().min(0, "Start must be ₹0 or more"),
  isActive: z.boolean().default(true),
});

/** Rejects a start that another ACTIVE band already uses. */
export async function assertUniqueStart(
  db: Prisma.TransactionClient,
  minAmount: number,
  exceptId?: string,
): Promise<string | null> {
  const clash = await db.budgetBand.findFirst({
    where: { isActive: true, minAmount, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { label: true },
  });
  return clash ? `Another active band (${clash.label}) already starts at that amount.` : null;
}

/**
 * Re-derives every ACTIVE band from the starts alone: sorted by start, each
 * ends ₹1 below the next one's start, the last is open-ended; labels and
 * order follow. Retired (inactive) bands keep their stored label/range.
 */
export async function recomputeActiveBands(db: Prisma.TransactionClient): Promise<void> {
  const active = await db.budgetBand.findMany({
    where: { isActive: true },
    orderBy: { minAmount: "asc" },
    select: { id: true, minAmount: true },
  });
  for (const [i, band] of active.entries()) {
    const next = active[i + 1];
    const maxAmount = next ? next.minAmount - 1 : null;
    await db.budgetBand.update({
      where: { id: band.id },
      data: { maxAmount, label: bandLabel(band.minAmount, maxAmount), sortOrder: i + 1 },
    });
  }
}

/** The bands are rendered by the public layout, so every public page refreshes. */
export function invalidateBudgetBands(): void {
  revalidateTag(BUDGET_BANDS_TAG, "max");
  revalidatePath("/", "layout");
}
