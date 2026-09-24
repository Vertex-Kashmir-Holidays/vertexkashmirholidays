// Shared lead-capture validation — used by BOTH the client <LeadForm /> and the
// server route (POST /api/leads). Keeping one schema means the client and server
// can never drift. No server-only imports here (no prisma/bcrypt), so this is
// safe to bundle into a client component.
//
// Phone validation reuses the create-account util in @/lib/auth/validation
// (libphonenumber-js), so the lead form behaves exactly like registration.

import { z } from "zod";
import { isValidE164 } from "@/lib/auth/validation";
import { attributionSchema } from "@/lib/attribution";

// ── Source page tags ─────────────────────────────────────────────────────────
// Distinct per-placement identifier stored on Lead.sourcePage for campaign
// attribution. The LeadSource enum (channel) is derived server-side from this.
export const LEAD_SOURCES = [
  "home",
  "tours",
  "destinations",
  "blog-list",
  "blog-detail",
  "destination-detail",
  "tour-detail",
  "activities",
  "activity-detail",
  "about",
  "contact",
  "campaign",
  "reviews",
  "tour-category",
  "faq",
  "flight-train-quote",
  "tour-origin-city",
  "trip-planner",
] as const;

export type LeadSourcePage = (typeof LEAD_SOURCES)[number];

// ── Trip Planner structured intent ───────────────────────────────────────────
// WHAT the customer wants — orthogonal to `source` (WHERE they came from) and
// `sourcePage` (WHICH form fired). Mirrors Lead.requestedComponents/
// transportModes exactly (see prisma/schema.prisma's doc comment on those
// columns for the full rationale). "PLAN" ("Help Me Plan") is its own
// distinct value — never expand it into the other three at write time.
export const REQUESTED_COMPONENTS = ["TRANSPORT", "TOUR", "HOTEL", "PLAN"] as const;
export type RequestedComponent = (typeof REQUESTED_COMPONENTS)[number];

export const TRANSPORT_MODES = ["FLIGHT", "TRAIN", "BUS"] as const;
export type TransportModeValue = (typeof TRANSPORT_MODES)[number];

// Shared display labels — the one place these are authored, reused by the
// public TripPlannerForm/LeadForm WhatsApp message, POST /api/leads' notes
// summary, and the admin Leads list/detail views, so the three never drift.
export const REQUESTED_COMPONENT_LABELS: Record<RequestedComponent, string> = {
  TRANSPORT: "Transport",
  TOUR: "Kashmir Tour",
  HOTEL: "Hotel/Stay",
  PLAN: "Help Me Plan",
};

export const TRANSPORT_MODE_LABELS: Record<TransportModeValue, string> = {
  FLIGHT: "Flight",
  TRAIN: "Train",
  BUS: "Bus",
};

// ── Name ─────────────────────────────────────────────────────────────────────
// Letters (any script), spaces, and . ' - only. ASCII control chars (incl.
// CR/LF) are stripped before validation so a pasted/forged value can't sneak
// newlines through (defends the email-subject line too).
const NAME_ALLOWED = /^[\p{L}][\p{L} .'-]*$/u;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export const nameField = z
  .string()
  .transform((s) => s.replace(CONTROL_CHARS, "").trim())
  .pipe(
    z
      .string()
      .min(2, "Please enter your name (at least 2 characters).")
      .max(60, "Name is too long.")
      .regex(NAME_ALLOWED, "Use letters, spaces and . ' - only."),
  );

// ── Phone ────────────────────────────────────────────────────────────────────
// The client sends an E.164 string (e.g. +919876543210) produced by toE164().
export const phoneField = z
  .string()
  .trim()
  .refine(isValidE164, "Please enter a valid phone number.");

// ── Email (optional) ─────────────────────────────────────────────────────────
// Normalized to lowercase + trimmed. Empty string is treated as "not provided".
export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address.")
  .optional()
  .or(z.literal(""));

// ── Context (optional, page-dependent) ───────────────────────────────────────
export const leadContextSchema = z.object({
  tourSlug: z.string().max(160).optional(),
  tourId: z.string().max(40).optional(),
  tourName: z.string().max(200).optional(),
  destinationSlug: z.string().max(160).optional(),
  destinationName: z.string().max(200).optional(),
  travelDate: z.string().max(40).optional(),
  travellers: z.coerce.number().int().positive().max(99).optional(),
  // Flight/train quote requests only (source: "flight-train-quote") — we have
  // no live fare API, so this is what sales needs to check Akbar/Riya/TripJack
  // and call the customer back with real options.
  fromCity: z.string().max(100).optional(),
  transportMode: z.enum(["FLIGHT", "TRAIN", "BUS", "EITHER"]).optional(),
  returnDate: z.string().max(40).optional(),
  // Which on-page instance of the transport-assistance banner this came from
  // (homepage, tour detail, listing sidebar, etc.) — lets sales and analytics
  // tell placements apart even though they all share source "flight-train-quote".
  placement: z.string().max(40).optional(),
  // Trip Planner (source: "trip-planner") + TransportAssistanceBanner (which
  // maps its own single-value transportMode above into this array). toCity
  // defaults to Srinagar on the public page but is still carried explicitly
  // so a future multi-destination trip isn't a schema change.
  requestedComponents: z.array(z.enum(REQUESTED_COMPONENTS)).max(4).optional(),
  transportModes: z.array(z.enum(TRANSPORT_MODES)).max(3).optional(),
  toCity: z.string().max(100).optional(),
});

export type LeadContext = z.infer<typeof leadContextSchema>;

// ── Full lead payload ────────────────────────────────────────────────────────
export const leadInputSchema = z.object({
  name: nameField,
  phone: phoneField,
  email: emailField,
  // Mandatory consent — must be ticked.
  agree: z.boolean().refine((v) => v === true, {
    message: "Please accept the Terms & Conditions and Privacy Policy.",
  }),
  source: z.enum(LEAD_SOURCES),
  context: leadContextSchema.optional(),
  // First-touch marketing attribution captured client-side (src/lib/attribution.ts).
  attribution: attributionSchema.optional(),
});

export type LeadInput = z.input<typeof leadInputSchema>;
export type LeadParsed = z.output<typeof leadInputSchema>;
