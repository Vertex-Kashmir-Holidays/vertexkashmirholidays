import type { OfferHotelLink } from "@/lib/offers/view";

/**
 * "Hotel A / Hotel B / Similar" — each name links to its Google profile in a
 * new tab. Falls back to the class ("4-Star Hotel") when the plan has no
 * options for that place.
 */
export function OfferHotelNames({
  hotels,
  classLabel,
}: {
  hotels: OfferHotelLink[];
  classLabel: string;
}) {
  if (hotels.length === 0) return <>{classLabel}</>;
  return (
    <>
      {hotels.map((h) => (
        <span key={h.name}>
          {h.googleUrl ? (
            <a
              href={h.googleUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-semibold text-foreground underline decoration-primary/50 underline-offset-2 transition hover:text-primary"
            >
              {h.name}
            </a>
          ) : (
            <span className="font-semibold text-foreground">{h.name}</span>
          )}
          {" / "}
        </span>
      ))}
      <span>Similar</span>
    </>
  );
}
