// Shared lead-capture validation — used by BOTH the client <LeadForm /> and the
// server route (POST /api/leads). Keeping one schema means the client and server
// can never drift. No server-only imports here (no prisma/bcrypt), so this is
// safe to bundle into a client component.
//
// Phone validation reuses the create-account util in @/lib/auth/validation
// (libphonenumber-js), so the lead form behaves exactly like registration.

import { z } from "zod";
import { isValidE164 } from "@/lib/auth/validation";

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
] as const;

export type LeadSourcePage = (typeof LEAD_SOURCES)[number];

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
  tourId:   z.string().max(40).optional(),
  tourName: z.string().max(200).optional(),
  destinationSlug: z.string().max(160).optional(),
  destinationName: z.string().max(200).optional(),
  travelDate: z.string().max(40).optional(),
  travellers: z.coerce.number().int().positive().max(99).optional(),
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
});

export type LeadInput = z.input<typeof leadInputSchema>;
export type LeadParsed = z.output<typeof leadInputSchema>;
