// Client-safe field definitions for the page-content list models.
// NO prisma import here — used by both the ListEditor (client) and the generic
// API (server). All list models share `sortOrder` + `isActive`, appended below.
import { z } from "zod";

export type FieldType = "text" | "textarea" | "number" | "date" | "image" | "boolean";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
}

function fieldSchema(f: FieldDef): z.ZodTypeAny {
  switch (f.type) {
    case "number":
      return f.required ? z.coerce.number() : z.coerce.number().nullish();
    case "date":
      return z.coerce.date().nullish();
    case "boolean":
      return z.boolean().optional();
    default: // text | textarea | image are all strings
      return f.required
        ? z.string().min(1, `${f.label} is required`)
        : z.string().nullish();
  }
}

// Most list models share `sortOrder` + `isActive`; a couple don't.
export interface ResourceMeta {
  sortable: boolean;
  activatable: boolean;
}

const META_OVERRIDES: Record<string, ResourceMeta> = {
  siteStats: { sortable: true, activatable: false },
  homeSections: { sortable: false, activatable: false },
};

export function getMeta(key: string): ResourceMeta {
  return META_OVERRIDES[key] ?? { sortable: true, activatable: true };
}

/** Build a zod schema for a resource's create payload (content fields + sortOrder/isActive). */
export function buildItemSchema(fields: FieldDef[], meta: ResourceMeta = { sortable: true, activatable: true }) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) shape[f.key] = fieldSchema(f);
  if (meta.sortable) shape.sortOrder = z.coerce.number().int().optional();
  if (meta.activatable) shape.isActive = z.boolean().optional();
  return z.object(shape);
}

/** Field metadata per resource key (the plural key is also the API path segment). */
export const FIELD_DEFS: Record<string, FieldDef[]> = {
  // ── Home ──
  heroSlides: [
    { key: "image", label: "Image", type: "image", required: true },
    { key: "imageMobile", label: "Mobile Image", type: "image" },
    { key: "alt", label: "Alt text", type: "text" },
  ],
  tickerItems: [{ key: "text", label: "Text", type: "text", required: true }],
  siteStats: [
    { key: "section", label: "Section", type: "text", required: true, placeholder: "home / about" },
    { key: "label", label: "Label", type: "text", required: true },
    { key: "value", label: "Value", type: "text", required: true },
    { key: "suffix", label: "Suffix", type: "text", placeholder: "+ / %" },
  ],
  whyChooseItems: [
    { key: "emoji", label: "Emoji", type: "text", required: true },
    { key: "title", label: "Title", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", required: true },
  ],
  offers: [
    { key: "badge", label: "Badge", type: "text" },
    { key: "title", label: "Title", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "image", label: "Image", type: "image" },
    { key: "price", label: "Price", type: "number", required: true },
    { key: "oldPrice", label: "Old price", type: "number" },
    { key: "endsText", label: "Ends text", type: "text" },
    { key: "validUntil", label: "Valid until", type: "date" },
    { key: "ctaHref", label: "CTA link", type: "text" },
  ],
  testimonials: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "location", label: "Location", type: "text" },
    { key: "avatar", label: "Avatar", type: "image" },
    { key: "quote", label: "Quote", type: "textarea", required: true },
    { key: "rating", label: "Rating", type: "number" },
  ],
  videoReviews: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "place", label: "Place", type: "text" },
    { key: "duration", label: "Duration", type: "text", placeholder: "2:30" },
    { key: "thumbnail", label: "Thumbnail", type: "image", required: true },
    { key: "videoUrl", label: "Video URL", type: "text" },
  ],
  homeSections: [
    { key: "key", label: "Section key", type: "text", required: true, placeholder: "packages / destinations" },
    { key: "kicker", label: "Kicker", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "ctaLabel", label: "CTA label", type: "text" },
    { key: "ctaHref", label: "CTA link", type: "text" },
  ],
  // ── About ──
  aboutStoryFeatures: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "subtitle", label: "Subtitle", type: "text", required: true },
    { key: "icon", label: "Icon", type: "text", required: true },
  ],
  aboutStats: [
    { key: "value", label: "Value", type: "text", required: true },
    { key: "label", label: "Label", type: "text", required: true },
    { key: "icon", label: "Icon", type: "text", required: true },
  ],
  aboutValues: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "subtitle", label: "Subtitle", type: "textarea", required: true },
    { key: "icon", label: "Icon", type: "text", required: true },
  ],
  teamMembers: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "role", label: "Role", type: "text", required: true },
    { key: "bio", label: "Bio", type: "textarea", required: true },
    { key: "image", label: "Photo", type: "image", required: true },
  ],
  journeyMilestones: [
    { key: "year", label: "Year", type: "text", required: true },
    { key: "detail", label: "Detail", type: "textarea", required: true },
    { key: "icon", label: "Icon", type: "text", required: true },
  ],
  pressLogos: [{ key: "html", label: "Logo HTML / name", type: "textarea", required: true }],
  // ── Contact ──
  contactHeroFeatures: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "subtitle", label: "Subtitle", type: "text", required: true },
    { key: "icon", label: "Icon", type: "text", required: true },
  ],
  contactPromiseItems: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "subtitle", label: "Subtitle", type: "text", required: true },
    { key: "icon", label: "Icon", type: "text", required: true },
  ],
  contactFaqs: [
    { key: "question", label: "Question", type: "text", required: true },
    { key: "answer", label: "Answer", type: "textarea", required: true },
  ],
  contactOffices: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "address", label: "Address", type: "textarea", required: true },
    { key: "hours", label: "Hours", type: "text", required: true },
  ],
};

export type ResourceKey = keyof typeof FIELD_DEFS;
