import { z } from "zod";

// JSON-string fields (stored as String in the DB, defaulting to "[]").
export const CAMPAIGN_JSON_FIELDS = [
  "facts", "strip", "stats", "highlights", "activities", "itinerary",
  "tiers", "batches", "inclusions", "exclusions", "gallery", "faqs",
] as const;

// Plain nullable string fields.
export const CAMPAIGN_TEXT_FIELDS = [
  "badge", "titleHtml", "sub", "heroImage", "finalImage", "heroImageMobile",
  "heroCta", "proofCount", "offerText", "offerSeats", "navCta", "phone", "whatsappHref",
  "filmTitle", "filmDuration", "filmPoster", "filmSrc", "highlightsTitle", "activitiesTitle",
  "itineraryTitle", "galleryTitle", "faqsTitle", "finalTitle", "finalSub", "finalCta",
  "finalNote", "metaTitle", "metaDesc", "ogImage",
] as const;

const jsonArray = z
  .string()
  .refine((s) => {
    try {
      return Array.isArray(JSON.parse(s));
    } catch {
      return false;
    }
  }, "Must be a valid JSON array");

const textShape = Object.fromEntries(CAMPAIGN_TEXT_FIELDS.map((k) => [k, z.string().nullish()]));
const jsonShape = Object.fromEntries(CAMPAIGN_JSON_FIELDS.map((k) => [k, jsonArray.optional()]));

export const campaignSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  name: z.string().min(1, "Name is required"),
  published: z.boolean().optional(),
  accent: z.string().optional(),
  accent2: z.string().optional(),
  particles: z.string().optional(),
  offerDeadline: z.coerce.date().nullish(),
  ...textShape,
  ...jsonShape,
});

export type CampaignInput = z.infer<typeof campaignSchema>;
