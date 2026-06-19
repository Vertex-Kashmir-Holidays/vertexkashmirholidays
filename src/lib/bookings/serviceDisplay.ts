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

/** A human, price-free detail line for a service. */
export function serviceDetailLine(s: DisplayService): string {
  switch (s.kind) {
    case "HOTEL": {
      const parts: string[] = [];
      if (s.location) parts.push(s.location);
      if (s.nights != null) parts.push(`${s.nights} night${s.nights === 1 ? "" : "s"}`);
      return parts.join(" · ");
    }
    case "TRANSPORT": {
      const route = [s.pickup, s.dropoff].filter(Boolean).join(" → ");
      return route ? `Route: ${route}` : "";
    }
    case "ACTIVITY": {
      const parts: string[] = [];
      if (s.timing) parts.push(s.timing);
      if (s.location) parts.push(s.location);
      return parts.join(" · ");
    }
    default:
      return "";
  }
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
