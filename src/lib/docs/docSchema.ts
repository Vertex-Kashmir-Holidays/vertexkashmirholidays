import { z } from "zod";

// Title + purpose of an uploaded document — shared between the admin form
// (DocModal) and the Route Handlers under src/app/api/admin/docs/**, same
// convention as linkSchema.ts. The file itself is validated separately
// (MIME/size) in the upload route.
export const docMetaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(300).default(""),
});

// Spelled out rather than docMetaSchema.partial(): a partial of a .default("")
// field can still fill in "" and wipe the saved purpose on a title-only edit.
export const docMetaPatchSchema = z.object({
  title: docMetaSchema.shape.title.optional(),
  description: z.string().trim().max(300).optional(),
});

export type DocMetaInput = z.infer<typeof docMetaSchema>;
