// Standard name for every staff document (proposals, itineraries — standalone,
// lead/booking-linked and B2B): "<customer name> - <duration> - <phone>", e.g.
// "Mr Farooq Sheikh - 5 Nights · 6 Days - +91 98765 43210". Empty parts (and a
// "to be decided" duration) are skipped. Shared by the editors (live title in
// the toolbar), the API routes (authoritative title written to the DB) and
// scripts/standardize-itinerary-titles.ts, so they can never drift.
//
// Titles are unique per table (drafts and sent alike). A duplicated document
// starts as "<source title> - copy" and can only be saved once its customer
// name/phone/duration makes the regenerated title unique; a copy left
// unchanged is deleted (see isCopyTitle / useDiscardUntouchedCopy).

const MAX_TITLE_LENGTH = 200;
/** Untouched copies older than this are purged when a list loads. */
export const STALE_COPY_MS = 2 * 60 * 60 * 1000;
const COPY_SUFFIX = " - copy";
const COPY_TITLE = / - copy( \d+)?$/i;
const UNDECIDED_DURATION = /^to be decided$/i;

type TitleSource = { preparedFor: string; duration: string; customerPhone?: string | null };

const clean = (part: string | null | undefined) => (part ?? "").replace(/\s+/g, " ").trim();

export function buildDocumentTitle(data: TitleSource): string {
  const duration = clean(data.duration);
  return [
    clean(data.preparedFor),
    UNDECIDED_DURATION.test(duration) ? "" : duration,
    clean(data.customerPhone),
  ]
    .filter(Boolean)
    .join(" - ")
    .slice(0, MAX_TITLE_LENGTH) || "Untitled";
}

export function isCopyTitle(title: string): boolean {
  return COPY_TITLE.test(title);
}

export function copyTitleCandidates(sourceTitle: string): (n: number) => string {
  const base = sourceTitle.replace(COPY_TITLE, "").slice(0, MAX_TITLE_LENGTH - 12);
  return (n) => `${base}${COPY_SUFFIX}${n > 1 ? ` ${n}` : ""}`;
}

/**
 * First free title from `candidate(1)`, `candidate(2)`, … — for titles the
 * system assigns itself (copies, lead/booking/B2B itineraries), where refusing
 * with a 409 isn't an option.
 */
export async function firstFreeTitle(
  candidate: (n: number) => string,
  exists: (title: string) => Promise<boolean>,
): Promise<string> {
  for (let n = 1; ; n++) {
    const title = candidate(n);
    if (!(await exists(title))) return title;
  }
}

/** `title`, or "title (2)", "title (3)", … if taken. */
export function uniqueTitle(title: string, exists: (title: string) => Promise<boolean>) {
  return firstFreeTitle((n) => (n > 1 ? `${title.slice(0, MAX_TITLE_LENGTH - 6)} (${n})` : title), exists);
}

export function duplicateTitleMessage(title: string): string {
  return `“${title}” already exists. Change the customer name, phone or duration, or open the existing one.`;
}
