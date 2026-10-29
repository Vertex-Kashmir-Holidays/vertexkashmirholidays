// Server-only rate card helpers. Every save of `data` goes through
// saveRateCardData so history is never skipped: the previous data is
// snapshotted into RateCardRevision and `version` is bumped, in the caller's
// transaction.
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { rateCardDataSchema, type RateCardData, type RateCardMeta } from "./schema";

/** 422 naming the first invalid field, e.g. "tiers.2.hotels.0.name: Hotel name is required". */
export function validationErrorResponse(error: ZodError): NextResponse {
  const issue = error.issues[0];
  const path = issue?.path.join(".");
  return NextResponse.json(
    { error: issue ? (path ? `${path}: ${issue.message}` : issue.message) : "Invalid rate card" },
    { status: 422 },
  );
}

/** Someone else saved the card since this editor loaded it. */
export class RateCardConflictError extends Error {
  constructor() {
    super("This rate card was changed by someone else. Reload to see the latest version.");
  }
}

export function parseRateCardData(json: unknown): RateCardData | null {
  const parsed = rateCardDataSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

/** "YYYY-MM-DD" → Date at UTC midnight (how the date columns are stored). */
export function dateFromInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function metaToColumns(meta: RateCardMeta) {
  return {
    name: meta.name,
    seasonLabel: meta.seasonLabel,
    startDate: dateFromInput(meta.startDate),
    endDate: dateFromInput(meta.endDate),
    notes: meta.notes || null,
  };
}

/**
 * Snapshot the card's current data as a revision, then write the new data
 * (and optional card fields) as version + 1. Returns false if the card
 * doesn't exist; throws RateCardConflictError if `expectedVersion` is stale.
 */
export async function saveRateCardData(
  tx: Prisma.TransactionClient,
  args: {
    id: string;
    expectedVersion: number;
    data: RateCardData;
    meta?: RateCardMeta;
    changeNote: string | null;
    userId: string;
  },
): Promise<boolean> {
  const current = await tx.rateCard.findUnique({
    where: { id: args.id },
    select: { version: true, data: true },
  });
  if (!current) return false;
  if (current.version !== args.expectedVersion) throw new RateCardConflictError();

  await tx.rateCardRevision.create({
    data: {
      rateCardId: args.id,
      version: current.version,
      data: current.data as Prisma.InputJsonValue,
      changeNote: args.changeNote || null,
      createdById: args.userId,
    },
  });
  // The version guard in `where` also catches a save that raced past the
  // check above (the revision's unique [rateCardId, version] would too).
  const updated = await tx.rateCard.updateMany({
    where: { id: args.id, version: current.version },
    data: {
      ...(args.meta ? metaToColumns(args.meta) : {}),
      data: args.data,
      version: { increment: 1 },
      updatedById: args.userId,
    },
  });
  if (updated.count === 0) throw new RateCardConflictError();
  return true;
}
