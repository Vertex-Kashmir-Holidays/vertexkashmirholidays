import { z } from "zod";

// One schema covers all service kinds; the UI shows only the relevant fields.
export const serviceBodySchema = z.object({
  kind: z.enum(["HOTEL", "TRANSPORT", "ACTIVITY", "OTHER"]),
  name: z.string().trim().min(1, "Name is required").max(200),
  amount: z.coerce.number().min(0, "Amount cannot be negative").default(0),
  location: z.string().trim().max(200).nullable().optional(),
  nights: z.coerce.number().int().min(0).nullable().optional(),
  roomType: z.string().trim().max(120).nullable().optional(),
  pickup: z.string().trim().max(200).nullable().optional(),
  dropoff: z.string().trim().max(200).nullable().optional(),
  timing: z.string().trim().max(200).nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const serviceUpdateSchema = serviceBodySchema.partial();

export type ServiceBody = z.infer<typeof serviceBodySchema>;

// ── Required before lock ────────────────────────────────────────────────────
// A row may be saved half-filled while staff work (auto-save only needs a
// name), but every service must be complete before the booking is locked and
// the summary goes to the customer. Shared by the lock route (authoritative)
// and the services editor (asterisks + red borders) so the two never drift.

export type ServiceKind = ServiceBody["kind"];
export type RequiredServiceField = "name" | "location" | "roomType" | "nights" | "pickup" | "dropoff" | "amount";

export const REQUIRED_SERVICE_FIELDS: Record<ServiceKind, RequiredServiceField[]> = {
  HOTEL: ["name", "location", "roomType", "nights", "amount"],
  TRANSPORT: ["name", "pickup", "dropoff", "amount"],
  // Activities/extras can be complimentary — no amount required.
  ACTIVITY: ["name", "location"],
  OTHER: ["name"],
};

const FIELD_LABELS: Record<ServiceKind, Partial<Record<RequiredServiceField, string>>> = {
  HOTEL: { name: "Hotel Name", location: "Location", roomType: "Room Type", nights: "Nights", amount: "Amount" },
  TRANSPORT: { name: "Cab Name", pickup: "Pick", dropoff: "Drop", amount: "Amount" },
  ACTIVITY: { name: "Name", location: "Location" },
  OTHER: { name: "Name" },
};

type ServiceValues = {
  kind: ServiceKind;
  name?: string | null;
  location?: string | null;
  roomType?: string | null;
  pickup?: string | null;
  dropoff?: string | null;
  nights?: number | string | null;
  amount?: number | string | null;
};

/** True when `field` counts as filled in (numbers: nights ≥ 1, amount > 0). */
export function isServiceFieldFilled(field: RequiredServiceField, value: unknown): boolean {
  if (field === "nights") return Number(value) >= 1;
  if (field === "amount") return Number(value) > 0;
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

/** Labels of the required fields this service is still missing (empty = complete). */
export function missingServiceFields(s: ServiceValues): string[] {
  return REQUIRED_SERVICE_FIELDS[s.kind]
    .filter((f) => !isServiceFieldFilled(f, s[f]))
    .map((f) => FIELD_LABELS[s.kind][f] ?? f);
}

const KIND_LABELS: Record<ServiceKind, string> = {
  HOTEL: "Hotel",
  TRANSPORT: "Transport",
  ACTIVITY: "Activity",
  OTHER: "Other",
};

/**
 * Everything blocking a lock, as user-facing lines — at least one hotel and
 * one cab, then each incomplete row ("Transport “Innova”: Pick, Drop").
 * Empty array = OK to lock.
 */
export function lockBlockers(services: ServiceValues[]): string[] {
  const out: string[] = [];
  if (!services.some((s) => s.kind === "HOTEL")) out.push("Add at least one hotel.");
  if (!services.some((s) => s.kind === "TRANSPORT")) out.push("Add at least one cab.");
  for (const s of services) {
    const missing = missingServiceFields(s);
    if (missing.length) {
      const name = s.name?.trim() ? ` “${s.name.trim()}”` : "";
      out.push(`${KIND_LABELS[s.kind]}${name}: ${missing.join(", ")}`);
    }
  }
  return out;
}
