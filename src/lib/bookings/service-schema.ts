import { z } from "zod";

// One schema covers all service kinds; the UI shows only the relevant fields.
export const serviceBodySchema = z.object({
  kind: z.enum(["HOTEL", "TRANSPORT", "ACTIVITY", "OTHER"]),
  name: z.string().trim().min(1, "Name is required").max(200),
  amount: z.coerce.number().min(0, "Amount cannot be negative").default(0),
  location: z.string().trim().max(200).nullable().optional(),
  nights: z.coerce.number().int().min(0).nullable().optional(),
  pickup: z.string().trim().max(200).nullable().optional(),
  dropoff: z.string().trim().max(200).nullable().optional(),
  timing: z.string().trim().max(200).nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const serviceUpdateSchema = serviceBodySchema.partial();

export type ServiceBody = z.infer<typeof serviceBodySchema>;
