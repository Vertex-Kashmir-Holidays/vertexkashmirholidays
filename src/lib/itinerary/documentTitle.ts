// Auto-generated names for the staff itinerary and proposal generators:
// "<prefix> - <customer name> - <duration>", e.g.
// "Kashmir Proposal - Mr Farooq Sheikh - 5 Nights · 6 Days". Shared by the
// editors (live title in the toolbar) and the API routes (authoritative title
// written to the DB) so the two can never drift.
export const PROPOSAL_TITLE_PREFIX = "Kashmir Proposal";
export const ITINERARY_TITLE_PREFIX = "Kashmir Itinerary";

const MAX_TITLE_LENGTH = 200;

export function buildDocumentTitle(
  prefix: string,
  data: { preparedFor: string; duration: string },
): string {
  return [prefix, data.preparedFor, data.duration]
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" - ")
    .slice(0, MAX_TITLE_LENGTH);
}

export function duplicateTitleMessage(title: string): string {
  return `“${title}” may already exist. Change the customer name or duration, or open the existing one.`;
}
