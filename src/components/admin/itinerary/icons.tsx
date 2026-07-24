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
  | "support";

export const ITINERARY_ICON_PATHS: Record<ItineraryIconKey, string> = {
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  "map-pin": "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M12 7v0",
  car: "M5 17h14l1-5-2-5H6L4 12Z M7.5 17.5v0 M16.5 17.5v0",
  star: "m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z",
  meals: "M4 3v7a3 3 0 0 0 6 0V3 M7 3v18 M17 3c-1.5 0-3 1.5-3 5s1.5 4 3 4v9",
  stay: "M3 11h18v8 M3 11V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4 M3 19h18",
  highlights: "m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z",
  drop: "M12 2s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12Z",
  home: "m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M9 21V12h6v9",
  shield: "M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z M9 12l2 2 4-4",
  medal: "M12 9a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z M9 14l-1.5 7L12 18.5 16.5 21 15 14",
  support: "M3 12a9 9 0 1 1 18 0v5a2 2 0 0 1-2 2h-3v-6h5 M3 12v5a2 2 0 0 0 2 2h3v-6H3",
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
