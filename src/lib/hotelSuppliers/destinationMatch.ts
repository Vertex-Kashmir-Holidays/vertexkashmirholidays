// Loose match between a stay's free-text destination ("Pahalgam",
// "Houseboat", "Gulmarg (2N)", "Dal Lake") and a hotel's list destination
// ("Pahalgam", "Houseboats", "Gulmarg / Tangmarg"). Client-safe.

// Extra words that mean a list destination.
const EXTRA_NAMES: Record<string, string[]> = {
  houseboats: ["dal lake", "nigeen", "dal"],
  "leh / ladakh": ["nubra", "pangong"],
  "katra / vaishno devi": ["vaishno"],
};

const singular = (s: string) => s.replace(/s\b/g, "");

export function stayMatchesHotelDestination(stayDestination: string, hotelDestination: string): boolean {
  const stay = singular(stayDestination.toLowerCase().replace(/\(.*?\)/g, " ").trim());
  if (stay.length < 3) return false;
  const hd = hotelDestination.toLowerCase();
  const names = [...hd.split("/").map((p) => p.trim()), ...(EXTRA_NAMES[hd] ?? [])]
    .map(singular)
    .filter(Boolean);
  return names.some((n) => stay.includes(n) || n.includes(stay));
}
