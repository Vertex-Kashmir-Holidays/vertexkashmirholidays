// Customer-safe display helpers for booking services. Used by the customer
// account area to show service details WITHOUT exposing per-service prices.

export type ServiceKind = "HOTEL" | "TRANSPORT" | "ACTIVITY" | "OTHER";

export interface DisplayService {
  kind: ServiceKind;
  name: string;
  location?: string | null;
  nights?: number | null;
  pickup?: string | null;
  dropoff?: string | null;
  timing?: string | null;
}

export const SERVICE_KIND_LABELS: Record<ServiceKind, string> = {
  HOTEL: "Accommodation",
  TRANSPORT: "Transport",
  ACTIVITY: "Activities",
  OTHER: "Other Inclusions",
};

/** A labelled, price-free field for a service (e.g. { label: "Location", value: "Srinagar" }). */
export interface ServiceField {
  label: string;
  value: string;
}

/**
 * Structured, price-free detail fields for a service, in display order. Mirrors
 * the admin services UI columns so the customer-facing views read the same way:
 *   Hotel    → Location | Nights
 *   Transport→ Pickup | Drop
 *   Activity → Duration | Location
 * Empty fields are dropped.
 */
export function serviceFields(s: DisplayService): ServiceField[] {
  const fields: ServiceField[] = [];
  switch (s.kind) {
    case "HOTEL":
      if (s.location) fields.push({ label: "Location", value: s.location });
      if (s.nights != null) fields.push({ label: "Nights", value: `${s.nights} night${s.nights === 1 ? "" : "s"}` });
      break;
    case "TRANSPORT":
      if (s.pickup) fields.push({ label: "Pickup", value: s.pickup });
      if (s.dropoff) fields.push({ label: "Drop", value: s.dropoff });
      break;
    case "ACTIVITY":
      if (s.timing) fields.push({ label: "Duration", value: s.timing });
      if (s.location) fields.push({ label: "Location", value: s.location });
      break;
    default:
      break;
  }
  return fields;
}

/** A human, price-free detail line for a service (labelled fields joined by " · "). */
export function serviceDetailLine(s: DisplayService): string {
  return serviceFields(s)
    .map((f) => `${f.label}: ${f.value}`)
    .join(" · ");
}

/** Group services by kind in a stable order, dropping empty groups. */
export function groupServices<T extends DisplayService>(services: T[]) {
  return (["HOTEL", "TRANSPORT", "ACTIVITY", "OTHER"] as const)
    .map((kind) => ({ kind, label: SERVICE_KIND_LABELS[kind], items: services.filter((x) => x.kind === kind) }))
    .filter((g) => g.items.length > 0);
}

export function parseInclusions(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
