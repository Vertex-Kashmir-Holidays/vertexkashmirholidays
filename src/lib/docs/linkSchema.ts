import { z } from "zod";

// Shared between the admin form (DocLinkModal) and the Route Handlers under
// src/app/api/admin/docs/links/** — see ../../../.ai/instructions/architecture.md
// → Business Logic ("Validation must be centralized as a Zod schema per
// domain, imported by both the form and the Route Handler").
export const docLinkCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  url: z.string().trim().url("Must be a valid URL").max(2000),
  purpose: z.string().trim().min(1, "Purpose is required").max(2000),
});

export const docLinkPatchSchema = docLinkCreateSchema.partial();

export type DocLinkCreateInput = z.infer<typeof docLinkCreateSchema>;
export type DocLinkPatchInput = z.infer<typeof docLinkPatchSchema>;
