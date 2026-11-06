// Destinations Library — shared shapes (client-safe). A day plan is one ready-
// written day heading + description for a route; picking it copies ONLY those
// two into a proposal day (see toProposalDay) — the day's stay, meals,
// highlights, photo and date are left as they are, and the copy stays editable.
import { z } from "zod";

export const DAY_PLAN_SEASONS = ["ALL_YEAR", "SUMMER", "WINTER"] as const;
export type DayPlanSeasonValue = (typeof DAY_PLAN_SEASONS)[number];

export const SEASON_LABELS: Record<DayPlanSeasonValue, string> = {
  ALL_YEAR: "All year",
  SUMMER: "Summer",
  WINTER: "Winter",
};

/** Suggested places for the route fields (free text is still allowed). */
export const DAY_PLAN_PLACES = [
  "Srinagar",
  "Gulmarg",
  "Pahalgam",
  "Sonamarg",
  "Doodhpathri",
  "Yusmarg",
  "Gurez",
  "Jammu",
  "Katra",
  "Patnitop",
  "Leh",
] as const;

const text = (max: number) => z.string().trim().max(max);

export const dayPlanInputSchema = z.object({
  fromPlace: text(60).min(1, "From is required"),
  toPlace: text(60).min(1, "To is required"),
  title: text(120).min(1, "Title is required"),
  body: text(2000).min(1, "Description is required"),
  season: z.enum(DAY_PLAN_SEASONS).default("ALL_YEAR"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type DayPlanInput = z.infer<typeof dayPlanInputSchema>;

/** PATCH body — every field optional and NO defaults, so unsent fields are left as they are. */
export const dayPlanPatchSchema = z.object({
  fromPlace: text(60).min(1).optional(),
  toPlace: text(60).min(1).optional(),
  title: text(120).min(1).optional(),
  body: text(2000).min(1).optional(),
  season: z.enum(DAY_PLAN_SEASONS).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export interface DayPlanRecord extends DayPlanInput {
  id: string;
  updatedAt: string;
}

/** "Srinagar → Gulmarg", or "Pahalgam (local)" when from and to match. */
export function routeLabel(p: { fromPlace: string; toPlace: string }): string {
  return p.fromPlace.trim().toLowerCase() === p.toPlace.trim().toLowerCase()
    ? `${p.fromPlace} (local)`
    : `${p.fromPlace} → ${p.toPlace}`;
}

/** Canonical spelling of a known place ("srinagar hotel" → null, "sonmarg" → "Sonamarg"). */
function knownPlace(text: string): string | null {
  const t = text.trim().toLowerCase();
  const aliases: Record<string, string> = { sonmarg: "Sonamarg", doodhpatri: "Doodhpathri" };
  if (aliases[t]) return aliases[t];
  return DAY_PLAN_PLACES.find((p) => p.toLowerCase() === t) ?? null;
}

/**
 * Best-guess route from a day heading, for "Save to library":
 *   "Srinagar to Sonmarg | Day Excursion" → Srinagar → Sonamarg
 *   "Arrival in Srinagar | Local Sightseeing" → Srinagar (local)
 * Falls back to blanks so staff fill it in, never to the stay text.
 */
export function guessRoute(title: string): { fromPlace: string; toPlace: string } {
  const head = title.split(/\s*[|—–-]\s*/)[0] ?? "";
  const pair = head.match(/^(.+?)\s+to\s+(.+)$/i);
  if (pair) {
    const from = knownPlace(pair[1]) ?? pair[1].trim();
    const to = knownPlace(pair[2]) ?? pair[2].trim();
    return { fromPlace: from, toPlace: to };
  }
  const words = title.toLowerCase();
  const hit = DAY_PLAN_PLACES.find((p) => words.includes(p.toLowerCase()));
  return hit ? { fromPlace: hit, toPlace: hit } : { fromPlace: "", toPlace: "" };
}

/** The only proposal-day fields a picked plan fills: heading and description. */
export function toProposalDay(p: Pick<DayPlanInput, "title" | "body">) {
  return { title: p.title, body: p.body };
}
