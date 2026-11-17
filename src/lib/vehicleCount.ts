// "How many vehicles" — shared by proposals (transport rows), itineraries
// (the vehicle card) and booking services (cab rows) so a group travelling in
// two cars reads the same everywhere: "2 × Innova Crysta".

/** Parse a count field ("2", 2, "", null) — null when blank or invalid. */
export function parseVehicleCount(v: string | number | null | undefined): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/**
 * Prefix the vehicle name with its count when more than one. Comparison
 * sentinels ("–", "✓") and blanks are returned as-is.
 */
export function withVehicleCount(
  name: string,
  count: string | number | null | undefined,
): string {
  const n = parseVehicleCount(count);
  return n != null && n > 1 && /[\p{L}\p{N}]/u.test(name) ? `${n} × ${name}` : name;
}
