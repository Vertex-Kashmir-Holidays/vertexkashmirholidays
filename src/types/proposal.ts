import { z } from "zod";
import { listItemSchema, cancelTierSchema, trustSchema } from "@/types/itinerary";

// Two document shapes share this one schema/editor/PDF: "multi" is the
// existing 3-tier comparison document (tiers/comparisonRows below), "single"
// is a one-package quotation (day-plan-at-a-glance table, stay plan,
// transportation, one price — see stayPlan/transport below). Cover, What's
// Covered, Payment & Cancellation, Why Choose Us and the closing page are
// shared verbatim by both — only the body sections that differ are gated on
// this field, in the editor and in ProposalPdf.tsx.
export const proposalDocTypeSchema = z.enum(["multi", "single"]);
export type ProposalDocType = z.infer<typeof proposalDocTypeSchema>;

// One card's worth of content for a single pricing tier (page 1's price box,
// page 2's option card, and the comparison table's per-tier columns all read
// from the same tier object).
export const proposalTierSchema = z.object({
  label: z.string(), // "Budget" / "Premium" / "Luxury" — the small eyebrow
  title: z.string(), // "The Essentials" — the option card's own headline
  priceLabel: z.string(), // e.g. "₹30,500" — free text, not computed
  // Short one-liner shown in the cover's small price box, e.g. "3-star ·
  // Shikara ride" — distinct from `description` below, which is the longer
  // paragraph on the page-2 option card.
  coverNote: z.string().default(""),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  // "MOST CHOSEN" — empty means no badge. Not hardcoded to a tier so staff
  // can move it to whichever option they're steering the lead towards.
  badgeLabel: z.string().default(""),
});
export type ProposalTier = z.infer<typeof proposalTierSchema>;

// Fixed-key object, not an array — the schema itself guarantees exactly the
// three named slots this document always has, so there's nothing to add or
// remove in the editor and no index-based bugs (tiers[0] vs tiers.budget).
export const proposalTiersSchema = z.object({
  budget: proposalTierSchema,
  premium: proposalTierSchema,
  luxury: proposalTierSchema,
});
export type ProposalTiers = z.infer<typeof proposalTiersSchema>;
export type ProposalTierKey = keyof ProposalTiers;
export const TIER_ORDER: ProposalTierKey[] = ["budget", "premium", "luxury"];

// Single-package doc uses exactly one of the three tier slots as its one
// price box — reusing proposalTierSchema/proposalTiersSchema above rather
// than adding a parallel "single price" shape.
export const SINGLE_TIER_KEY: ProposalTierKey = "premium";

// Comparison table cell sentinels — each cell is plain free text (same "what
// staff types is exactly what prints" convention used for hotel meal-type
// text), pattern-matched at render time rather than stored as a {kind,value}
// object: "" / "-" / "–" renders as a muted dash (not included), "✓" / "yes"
// renders as the green check icon, anything else renders as literal text.
export const COMPARISON_DASH = "–";
export const COMPARISON_CHECK = "✓";

export const comparisonRowSchema = z.object({
  id: z.string(),
  label: z.string(), // e.g. "Hotels", "Gulmarg Gondola"
  budget: z.string(),
  premium: z.string(),
  luxury: z.string(),
});
export type ComparisonRow = z.infer<typeof comparisonRowSchema>;

// The route/day-by-day plan is identical across all three tiers — simpler
// than itineraryDataSchema's daySchema: no image, no meta[] array. Day number
// comes from the array index at render time, same convention ItineraryPdf.tsx
// already uses for its own day cards.
export const proposalDaySchema = z.object({
  id: z.string(),
  title: z.string(),
  dateLabel: z.string().default(""),
  body: z.string(),
  stayLabel: z.string().default(""), // bed-icon line, e.g. "Srinagar"
  // Free text, rendered verbatim exactly as typed — no structured chip list.
  highlightsLine: z.string().default(""),
  // "Breakfast, Dinner" — only the single-package doc's "Day Plan at a
  // Glance" table has a Meals column; unused (blank) in the multi-package
  // document, so defaulted rather than required.
  mealsLabel: z.string().default(""),
});
export type ProposalDay = z.infer<typeof proposalDaySchema>;

// "Stay Plan" table — destination/nights/hotel/room. Shared by both docs:
// `hotelName` is the SINGLE_TIER_KEY (Premium) hotel, so a single-package
// proposal's hotels land in the Premium column when switched to multi;
// hotelBudget/hotelLuxury are only used by the multi-package doc. Read the
// per-option value through stayHotel() rather than these fields directly.
export const stayPlanRowSchema = z.object({
  id: z.string(),
  destination: z.string(),
  nights: z.string(),
  hotelName: z.string(),
  hotelBudget: z.string().default(""),
  hotelLuxury: z.string().default(""),
  roomType: z.string(),
  // Defaulted so proposals saved before this field existed load as one room.
  rooms: z.string().default("1"),
});
export type StayPlanRow = z.infer<typeof stayPlanRowSchema>;

// "Transportation" table — one row per vehicle. Same per-option convention
// as stayPlanRowSchema: `vehicle` is the Premium/single value.
export const transportRowSchema = z.object({
  id: z.string(),
  vehicle: z.string(),
  vehicleBudget: z.string().default(""),
  vehicleLuxury: z.string().default(""),
  seating: z.string(),
  usedFor: z.string(),
  duration: z.string(),
});
export type TransportRow = z.infer<typeof transportRowSchema>;

const STAY_HOTEL_FIELD = {
  budget: "hotelBudget",
  premium: "hotelName",
  luxury: "hotelLuxury",
} as const;
const TRANSPORT_VEHICLE_FIELD = {
  budget: "vehicleBudget",
  premium: "vehicle",
  luxury: "vehicleLuxury",
} as const;
export const stayHotelField = (key: ProposalTierKey) => STAY_HOTEL_FIELD[key];
export const transportVehicleField = (key: ProposalTierKey) => TRANSPORT_VEHICLE_FIELD[key];

/** Blank / "-" / "–" — the comparison "not included" sentinel. */
export const isComparisonDash = (v: string) => {
  const t = v.trim();
  return t === "" || t === "-" || t === COMPARISON_DASH;
};

/** Stay Plan rows from the days' stay labels — consecutive nights in the same
 *  place become one row. Used to seed an empty Stay Plan so it starts in sync
 *  with the day plan instead of with unrelated sample hotels. */
export function deriveStayPlan(
  days: ProposalDay[],
  genId: (prefix: string) => string,
): StayPlanRow[] {
  const rows: StayPlanRow[] = [];
  let prev = "";
  for (const day of days) {
    const place = day.stayLabel.trim();
    if (!place) {
      prev = "";
      continue;
    }
    const last = rows[rows.length - 1];
    if (place === prev && last) {
      last.nights = String(Number(last.nights) + 1).padStart(2, "0");
    } else {
      rows.push({
        id: genId("sp"),
        destination: place,
        nights: "01",
        hotelName: "",
        hotelBudget: "",
        hotelLuxury: "",
        roomType: "Double Sharing",
        rooms: "1",
      });
    }
    prev = place;
  }
  return rows;
}

export const proposalDataSchema = z.object({
  // Which document this is — see proposalDocTypeSchema above. Defaulted to
  // "multi" so every proposal saved before this field existed still loads
  // as the 3-tier document it always was.
  docType: proposalDocTypeSchema.default("multi"),

  // Cover
  quoteNumber: z.string().default(""),
  coverTitle: z.string(), // "Kashmir,"
  coverSubtitle: z.string().default(""), // "three ways"
  coverIntro: z.string().default(""),
  duration: z.string(), // "5 Nights · 6 Days"
  preparedByName: z.string().default(""),
  preparedByPhone: z.string().default(""),
  preparedFor: z.string(),
  // Customer's phone — shown under their name on the cover and in the
  // proposals list (for follow-ups). Defaulted so proposals saved before this
  // field existed still parse as blank.
  customerPhone: z.string().default(""),
  travelDates: z.string(),
  travelers: z.string(),

  tiers: proposalTiersSchema,

  // Page 2 — "you can mix these" tip box
  tipText: z.string().default(""),

  // Page 3 — comparison grid
  comparisonRows: z.array(comparisonRowSchema).default([]),
  comparisonFootnote: z.string().default(""),

  // Page 4 — same six days regardless of tier ("multi"), or the single
  // document's "Day Plan at a Glance" table ("single") — same underlying data.
  days: z.array(proposalDaySchema).default([]),

  // "Stay Plan" table + the note below it. Single-package prints it as its
  // own table; multi-package prints its per-option hotels as the comparison
  // table's "Stays" section.
  stayPlan: z.array(stayPlanRowSchema).default([]),
  stayPlanNote: z.string().default(""),

  // "Transportation" table + note — same single/multi split as stayPlan.
  transport: z.array(transportRowSchema).default([]),
  transportNote: z.string().default(""),

  // Activities, one value per option in the same cell convention as
  // comparisonRows (✓ / – / free text). Multi-package prints them as the
  // comparison table's "Activities" section; single-package lists the ones
  // its Premium column includes.
  activities: z.array(comparisonRowSchema).default([]),

  // Page 5 — what's covered + payment & cancellation (reused shapes)
  inc: z.array(listItemSchema).default([]),
  exc: z.array(listItemSchema).default([]),
  policyNote: z.string().default(""), // the cloud-snow "if snowfall..." box
  payStep1Title: z.string().default(""),
  payStep1Desc: z.string().default(""),
  payStep2Title: z.string().default(""),
  payStep2Desc: z.string().default(""),
  pay: z.array(z.string()).default([]),
  payNote: z.string().default(""),
  cancel: z.array(cancelTierSchema).default([]),
  cancelNotes: z.array(z.string()).default([]),

  // Why Choose Us — shown as its own section right after Payment &
  // Cancellation, and reused for the closing page's badge pills (same
  // dual-use pattern as itineraryDataSchema's `whyChoose`).
  whyChoose: z.array(trustSchema).default([]),

  // Page 6 — closing / how to confirm. Fixed at exactly 3 steps (same flat-
  // fields convention as payStep1/2 above) rather than an array, since the
  // count is fixed by the document's own design, not staff-editable.
  confirmStep1Title: z.string().default(""),
  confirmStep1Desc: z.string().default(""),
  confirmStep2Title: z.string().default(""),
  confirmStep2Desc: z.string().default(""),
  confirmStep3Title: z.string().default(""),
  confirmStep3Desc: z.string().default(""),
  closingHoldNote: z.string().default(""), // "this proposal holds for 7 days..."
});

export type ProposalData = z.infer<typeof proposalDataSchema>;
export type ProposalStatus = "DRAFT" | "SENT";

/** Light record used by the list view (no heavy `data` blob). */
export interface ProposalSummary {
  id: string;
  title: string;
  status: ProposalStatus;
  ownerId: string;
  ownerName?: string | null;
  /** From `data` — who the proposal is for, and their phone (follow-ups). */
  customerName?: string;
  customerPhone?: string;
  /** Package cost(s) from `data.tiers` — one for a single-package proposal,
   *  one per option (in TIER_ORDER) for a multi-option one. */
  packageCosts?: { label: string; price: string }[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

/** Full record returned by GET /api/proposals/[id]. */
export interface ProposalRecord extends ProposalSummary {
  data: ProposalData;
}
