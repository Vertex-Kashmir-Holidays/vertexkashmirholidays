// Occasion Offers — turns a published offer row (getOfferPage) plus its
// destinations into the plain, serializable view data every section of the
// public page renders. All derived facts (dates per day, night splits,
// overnight lines, compare-table rows) are computed here once, from the data
// marketing entered — nothing is hard-coded per occasion.
import { parseStringList } from "@/lib/tours/content";
import {
  STAY_TYPE_LABELS,
  formatDuration,
  formatNightSplit,
  formatOfferDates,
  formatTripDay,
  nightSplit,
  hotelsForStay,
  parseCompareValues,
  parseOfferHotels,
  parseOfferItinerary,
  parseOfferStays,
  stayClassLabel,
  stayPlaceLabel,
  tripNights,
} from "@/lib/offers/content";
import type { OfferPageData } from "@/lib/offers/queries";

export interface OfferDestinationView {
  slug: string;
  name: string;
  image: string | null;
  tagline: string | null;
  /** Fallback day description (the destination page's excerpt). */
  excerpt?: string | null;
  /** Fallback day highlights (the destination page's top attraction names). */
  attractions?: string[];
}

export interface OfferHotelLink {
  name: string;
  googleUrl: string | null;
}

export interface OfferStayView {
  /** 1-based night number. */
  night: number;
  place: string;
  destinationName: string;
  typeLabel: string;
  category: string;
  /** The plan's hotel options for this night's place — "A / B / Similar". */
  hotels: OfferHotelLink[];
  /** Shown instead when there are no options, e.g. "4-Star Hotel". */
  classLabel: string;
}

/** One hotel option in the "Where You'll Stay" slider. */
export interface OfferHotelView extends OfferHotelLink {
  place: string;
  destinationName: string;
  typeLabel: string;
  category: string;
  image: string | null;
  rating: number | null;
  reviewCount: number | null;
  location: string | null;
  /** 1-based nights this option covers. */
  nights: number[];
  /** True for a place with no hotel options yet — the card shows its class ("Budget Hotel"). */
  placeholder: boolean;
  /** The place's own photo (for the "Similar" card). */
  placeImage: string | null;
  /** "Budget Hotel", "Houseboat" … — the class the "Similar" card promises. */
  classLabel: string;
}

export interface OfferPlanView {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  priceForTwo: number;
  originalPriceForTwo: number | null;
  image: string | null;
  badge: string | null;
  mealPlan: string | null;
  vehicle: string | null;
  highlights: string[];
  inclusions: string[];
  split: { label: string; nights: number }[];
  splitLabel: string;
  stays: OfferStayView[];
  hotels: OfferHotelView[];
  /** Value per OccasionOffer.compareRows row id. */
  compareValues: Record<string, string>;
}

export interface OfferDayView {
  /** 0-based. */
  index: number;
  dateLabel: string | null;
  destination: OfferDestinationView | null;
  title: string;
  description: string;
  highlights: string[];
  image: string | null;
}

export function buildOfferView(o: OfferPageData, destinations: OfferDestinationView[]) {
  const bySlug = new Map(destinations.map((d) => [d.slug, d]));
  const destinationName = (slug: string) => bySlug.get(slug)?.name ?? slug;
  const nights = tripNights(o.startDate, o.endDate);

  const plans: OfferPlanView[] = o.packages.map((p) => {
    const stays = parseOfferStays(p.stays);
    const hotels = parseOfferHotels(p.hotels);
    const split = nightSplit(stays, destinationName);
    const link = (h: { name: string; googleUrl: string }) => ({
      name: h.name,
      googleUrl: h.googleUrl || null,
    });
    // Slider order: by the first night each option covers, admin order within
    // a place; options matching no night are left out.
    const hotelViews: OfferHotelView[] = hotels
      .map((h) => ({
        ...link(h),
        place: stayPlaceLabel(h, destinationName),
        destinationName: destinationName(h.destination),
        typeLabel: STAY_TYPE_LABELS[h.stayType],
        category: h.category,
        image: h.image || bySlug.get(h.destination)?.image || null,
        rating: h.rating > 0 ? h.rating : null,
        reviewCount: h.reviewCount > 0 ? h.reviewCount : null,
        location: h.location || null,
        nights: stays.flatMap((s, i) => (hotelsForStay(s, [h]).length ? [i + 1] : [])),
        placeholder: false,
        placeImage: bySlug.get(h.destination)?.image ?? null,
        classLabel: stayClassLabel({ ...h }) || STAY_TYPE_LABELS[h.stayType],
      }))
      .filter((h) => h.nights.length > 0);
    // Every place the plan sleeps in gets at least one card: its hotel options,
    // or — until marketing adds them — one card with the place's photo and the
    // class, so the carousel never falls back to plain text.
    for (const [i, s] of stays.entries()) {
      if (hotelsForStay(s, hotels).length) continue;
      const place = stayPlaceLabel(s, destinationName);
      const name = `${stayClassLabel(s) || STAY_TYPE_LABELS[s.stayType]} or similar`;
      const card = hotelViews.find((h) => h.placeholder && h.place === place && h.name === name);
      if (card) card.nights.push(i + 1);
      else
        hotelViews.push({
          name,
          googleUrl: null,
          place,
          destinationName: destinationName(s.destination),
          typeLabel: STAY_TYPE_LABELS[s.stayType],
          category: s.category,
          image: bySlug.get(s.destination)?.image ?? null,
          rating: null,
          reviewCount: null,
          location: null,
          nights: [i + 1],
          placeholder: true,
          placeImage: bySlug.get(s.destination)?.image ?? null,
          classLabel: stayClassLabel(s) || STAY_TYPE_LABELS[s.stayType],
        });
    }
    hotelViews.sort((a, b) => a.nights[0] - b.nights[0]);
    return {
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      description: p.description,
      priceForTwo: p.priceForTwo,
      originalPriceForTwo: p.originalPriceForTwo,
      image: null as string | null, // filled below, once every plan's stays are known
      badge: p.badge,
      mealPlan: p.mealPlan,
      vehicle: p.vehicle,
      highlights: parseStringList(p.highlights),
      inclusions: parseStringList(p.inclusions),
      split,
      splitLabel: formatNightSplit(split),
      stays: stays.map((s, i) => ({
        night: i + 1,
        place: stayPlaceLabel(s, destinationName),
        destinationName: destinationName(s.destination),
        typeLabel: STAY_TYPE_LABELS[s.stayType],
        category: s.category,
        hotels: hotelsForStay(s, hotels).map(link),
        classLabel: stayClassLabel(s),
      })),
      hotels: hotelViews,
      compareValues: parseCompareValues(p.compareValues),
    };
  });

  // Card photo: the plan's own image, else its most distinctive stay — the
  // place the fewest plans sleep in (Gulmarg for the plans that include it),
  // so the cards don't all show the same Srinagar photo.
  const placeCount = new Map<string, number>();
  for (const plan of plans)
    for (const place of new Set(plan.stays.map((s) => s.place)))
      placeCount.set(place, (placeCount.get(place) ?? 0) + 1);
  plans.forEach((plan, i) => {
    const own = o.packages[i].image;
    const stays = parseOfferStays(o.packages[i].stays);
    const signature = [...plan.stays]
      .reverse()
      .sort((a, b) => (placeCount.get(a.place) ?? 0) - (placeCount.get(b.place) ?? 0))[0];
    const signatureStay = signature ? stays[signature.night - 1] : undefined;
    const signatureImage =
      plan.hotels.find((h) => h.place === signature?.place && h.image)?.image ??
      (signatureStay ? bySlug.get(signatureStay.destination)?.image : null);
    plan.image = own ?? signatureImage ?? null;
  });

  // Days marketing hasn't written yet fall back to the destination page's own
  // content — its excerpt, and 3 of its top attractions (the next 3 on a
  // second day at the same place) — so a day card is never empty.
  const visits = new Map<string, number>();
  const days: OfferDayView[] = parseOfferItinerary(o.itinerary).map((d, i) => {
    const destination = bySlug.get(d.destination) ?? null;
    const visit = visits.get(d.destination) ?? 0;
    visits.set(d.destination, visit + 1);
    const attractions = destination?.attractions ?? [];
    const fallbackHighlights = attractions.slice(visit * 3, visit * 3 + 3);
    return {
      index: i,
      dateLabel: o.startDate ? formatTripDay(o.startDate, i) : null,
      destination,
      title: d.title || (destination ? `Day in ${destination.name}` : `Day ${i + 1}`),
      description: d.description || destination?.excerpt || "",
      highlights: d.highlights?.length
        ? d.highlights
        : fallbackHighlights.length
          ? fallbackHighlights
          : attractions.slice(0, 3),
      image: d.image || destination?.image || null,
    };
  });

  // The route in visiting order, one entry per destination, with its days.
  const route: (OfferDestinationView & { days: number[] })[] = [];
  for (const day of days) {
    if (!day.destination) continue;
    const stop = route.find((r) => r.slug === day.destination!.slug);
    if (stop) stop.days.push(day.index + 1);
    else route.push({ ...day.destination, days: [day.index + 1] });
  }

  // Compare Plans rows: one per place any plan sleeps in, in first-seen order.
  const places: string[] = [];
  for (const plan of plans) {
    for (const row of plan.split) if (!places.includes(row.label)) places.push(row.label);
  }

  const fromPrice = plans.length ? Math.min(...plans.map((p) => p.priceForTwo)) : null;

  return {
    plans,
    days,
    route,
    places,
    fromPrice,
    nights,
    duration: nights ? formatDuration(nights) : null,
    dates: formatOfferDates(o.startDate, o.endDate),
  };
}

export type OfferView = ReturnType<typeof buildOfferView>;
