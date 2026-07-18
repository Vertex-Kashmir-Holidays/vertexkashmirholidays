// Live Google rating + review count via the Places API (Place Details, legacy
// endpoint, Basic Data fields only — rating/user_ratings_total don't require
// the pricier Atmosphere Data tier that fetching `reviews` would). Server-only
// — GOOGLE_PLACES_API_KEY is never exposed to the client.
// Never throws: any failure (missing key, bad placeId, quota, network) just
// returns null so /reviews degrades gracefully instead of breaking the page.

import { env } from "@/lib/env";

export interface GooglePlaceRating {
  rating: number;
  total: number;
}

interface PlaceDetailsResponse {
  status: string;
  result?: {
    rating?: number;
    user_ratings_total?: number;
    opening_hours?: {
      weekday_text?: string[];
      periods?: { open: { day: number; time: string }; close?: { day: number; time: string } }[];
    };
    geometry?: { location?: { lat: number; lng: number } };
  };
}

export async function getGooglePlaceRating(placeId: string | null | undefined): Promise<GooglePlaceRating | null> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !placeId) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = (await res.json()) as PlaceDetailsResponse;
    if (data.status !== "OK" || !data.result || !data.result.rating) return null;

    return {
      rating: data.result.rating,
      total: data.result.user_ratings_total ?? 0,
    };
  } catch {
    return null;
  }
}

export interface GooglePlaceHours {
  /** Human-readable, one line per day, exactly as Google displays them — the single source of truth for the visible Contact page text. */
  weekdayText: string[];
  /** Machine-readable day/time pairs — feeds openingHoursSpecification schema from this same fetch, so display and schema can never disagree. */
  periods: { day: number; open: string; close: string }[];
}

export interface GooglePlaceLocation {
  lat: number;
  lng: number;
}

// Fetches opening hours + geo coordinates in one call (both are Basic/Contact
// Data fields, same pricing tier as the rating lookup above). Kept separate
// from getGooglePlaceRating rather than merged into it — callers that only
// need the rating (e.g. hero badges) shouldn't pay for parsing hours/geo they
// don't use, and the two are cached independently by Next's fetch cache.
export async function getGooglePlaceHoursAndLocation(
  placeId: string | null | undefined,
): Promise<{ hours: GooglePlaceHours | null; location: GooglePlaceLocation | null }> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !placeId) return { hours: null, location: null };

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=opening_hours,geometry&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { hours: null, location: null };

    const data = (await res.json()) as PlaceDetailsResponse;
    if (data.status !== "OK" || !data.result) return { hours: null, location: null };

    const oh = data.result.opening_hours;

    const hours: GooglePlaceHours | null =
      oh?.weekday_text && oh.weekday_text.length > 0
        ? {
            weekdayText: oh.weekday_text,
            // A period with no `close` means open 24h that day; skip it rather
            // than guess a close time schema.org would treat as authoritative.
            periods: (oh.periods ?? [])
              .filter((p): p is { open: { day: number; time: string }; close: { day: number; time: string } } => Boolean(p.close))
              .map((p) => ({ day: p.open.day, open: p.open.time, close: p.close.time })),
          }
        : null;

    const loc = data.result.geometry?.location;
    const location: GooglePlaceLocation | null = loc ? { lat: loc.lat, lng: loc.lng } : null;

    return { hours, location };
  } catch {
    return { hours: null, location: null };
  }
}
