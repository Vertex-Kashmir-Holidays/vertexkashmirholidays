// Server-only offer letter helpers shared by the API routes.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildRefNo, offerLetterDataSchema, type OfferLetterData } from "./schema";

export async function loadOfferLetter(id: string) {
  const row = await prisma.offerLetter.findUnique({ where: { id } });
  if (!row) return null;
  const parsed = offerLetterDataSchema.safeParse(row.data);
  return parsed.success ? { ...row, data: parsed.data } : null;
}

/** Sequence part of a ref no ("VKH/2026/0106/2" → 2). */
function refSequence(refNo: string): number {
  return Number(refNo.split("/").at(-1)) || 0;
}

/**
 * Next ref no for a letter dated `letterDate`: sequence = highest issued this
 * year + 1. The refNo column is unique, so a concurrent create just retries.
 */
export async function createWithRefNo(
  letterDate: string,
  create: (refNo: string) => Promise<{ id: string; refNo: string }>,
) {
  const year = letterDate.slice(0, 4);
  for (let attempt = 0; attempt < 3; attempt++) {
    const sameYear = await prisma.offerLetter.findMany({
      where: { refNo: { startsWith: `VKH/${year}/` } },
      select: { refNo: true },
    });
    const next = Math.max(0, ...sameYear.map((l) => refSequence(l.refNo))) + 1;
    try {
      return await create(buildRefNo(letterDate, next));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  throw new Error("Could not allocate a reference number — please try again.");
}

/** Keep the sequence, refresh the DDMM part when the letter date changes. */
export function refNoForDate(currentRefNo: string, letterDate: string): string {
  return buildRefNo(letterDate, refSequence(currentRefNo));
}

export function toJson(data: OfferLetterData): Prisma.InputJsonValue {
  return data as unknown as Prisma.InputJsonValue;
}
