// Safe icon registry for the itinerary document.
// Icons are addressed by a string key (stored in data) and rendered from a
// fixed set of <path> definitions — never from raw HTML — so DB/user-driven
// icon values can't inject markup.

export type ItineraryIconKey =
  | "calendar"
  | "map-pin"
  | "car"
  | "star"
  | "meals"
  | "stay"
  | "highlights"
  | "drop"
  | "home"
  | "shield"
  | "medal"
  | "support"
  | "users"
  | "clock";

// Path data verified against lucide-react's published icon set (utensils, bed,
// headset, users, star, shield-check) rather than hand-drawn, so the shapes
// are correct/recognizable — only `calendar`/`car`/`map-pin`/`drop`/`home`/
// `medal` are unchanged from before (already correct, no reason to touch).
export const ITINERARY_ICON_PATHS: Record<ItineraryIconKey, string> = {
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  "map-pin": "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M12 7v0",
  car: "M5 17h14l1-5-2-5H6L4 12Z M7.5 17.5v0 M16.5 17.5v0",
  star: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
  meals: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  stay: "M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9",
  highlights: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
  drop: "M12 2s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12Z",
  home: "m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M9 21V12h6v9",
  shield: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z M9 12L11 14L15 10",
  medal: "M12 9a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z M9 14l-1.5 7L12 18.5 16.5 21 15 14",
  support: "M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z M21 16v2a4 4 0 0 1-4 4h-5",
  // Single filled person silhouette (not a multi-figure "group" glyph) —
  // reads clearly as solid/filled at the small sizes this is used at (the
  // cover's TRAVELLERS stat), matching the visual weight of the solid star
  // beside it. Actual headcount is already in the value text ("2 Adults · 1
  // Child"), so the icon's job is just "traveller", not literally N bodies.
  users: "M12 2a4 4 0 1 0 0 8a4 4 0 1 0 0-8Z M12 12c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z",
  // Closed circle (solid-capable) + hour/minute hands as a separate stroke
  // overlay — same "filled body + white overlay stroke" treatment as
  // `shield`'s checkmark. Used for an activity's Time field.
  clock: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0 M12 6L12 12L16 14",
};

export const ITINERARY_ICON_KEYS = Object.keys(ITINERARY_ICON_PATHS) as ItineraryIconKey[];

/** Resolve an icon key to its path data, falling back to a neutral dot. */
function pathFor(icon: string): string {
  return ITINERARY_ICON_PATHS[icon as ItineraryIconKey] ?? "M12 8v0 M12 12v0 M12 16v0";
}

interface ItineraryIconProps {
  icon: string;
  className?: string;
  strokeWidth?: number;
}

export function ItineraryIcon({
  icon,
  className = "h-6 w-6",
  strokeWidth = 1.6,
}: ItineraryIconProps) {
  const d = pathFor(icon);
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}
