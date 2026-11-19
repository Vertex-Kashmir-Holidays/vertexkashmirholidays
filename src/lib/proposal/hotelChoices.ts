// A proposal stay can offer several hotels ("Hotel A / Hotel B") — stored as
// one string so the PDF prints it as-is. The itinerary gets the single hotel
// picked at "Convert to Itinerary". Pure helpers, safe on client and server.

export const HOTEL_CHOICE_SEPARATOR = " / ";

const isSimilar = (s: string) => /^(or\s+)?similar\.?$/i.test(s.trim());

/** "Hotel A / Hotel B / Similar" → { choices: ["Hotel A", "Hotel B"], similar: true } */
export function parseHotelChoices(v: string | undefined | null): { choices: string[]; similar: boolean } {
  const parts = (v ?? "")
    // Any "/" (typed text often has no spaces: "Hotel A/ Hotel B /Similar").
    .split(/\s*\/\s*|\s*\n\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const similar = parts.some(isSimilar);
  // "Hotel X or similar" written in one piece.
  const choices = parts
    .filter((p) => !isSimilar(p))
    .map((p) => p.replace(/\s*,?\s+or\s+similar\.?$/i, "").trim())
    .filter(Boolean);
  return { choices, similar: similar || parts.some((p) => /\s+or\s+similar\.?$/i.test(p)) };
}

export function joinHotelChoices(choices: string[], similar = false): string {
  const list = choices.map((c) => c.trim());
  return [...list, ...(similar ? ["Similar"] : [])].join(HOTEL_CHOICE_SEPARATOR);
}
