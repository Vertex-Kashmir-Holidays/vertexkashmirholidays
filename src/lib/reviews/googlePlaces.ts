// Live Google rating + review count via the Places API (Place Details, legacy
// endpoint, Basic Data fields only — rating/user_ratings_total don't require
// the pricier Atmosphere Data tier that fetching `reviews` would). Server-only
// — GOOGLE_PLACES_API_KEY is never exposed to the client.
// Never throws: any failure (missing key, bad placeId, quota, network) just
// returns null so /reviews degrades gracefully instead of breaking the page.

export interface GooglePlaceRating {
  rating: number;
  total: number;
}

interface PlaceDetailsResponse {
  status: string;
  result?: {
    rating?: number;
    user_ratings_total?: number;
  };
}

export async function getGooglePlaceRating(placeId: string | null | undefined): Promise<GooglePlaceRating | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
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
