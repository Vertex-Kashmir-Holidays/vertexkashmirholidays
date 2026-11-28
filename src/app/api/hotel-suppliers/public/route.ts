import { NextResponse } from "next/server";
import { getPublicHotels } from "@/lib/hotelSuppliers/stats";

export const dynamic = "force-dynamic";

// Public, unauthenticated: the Trip Planner hotel carousel's data. Served from
// /api/ (disallowed in robots.txt, plus X-Robots-Tag) and fetched client-side
// so hotel names never appear in the page HTML search engines index — hotel
// names must not show up in search from the Vertex site. Same showOnWebsite
// gate as before; never rates or contacts.
export async function GET() {
  return NextResponse.json(await getPublicHotels(), {
    headers: { "X-Robots-Tag": "noindex, nofollow" },
  });
}
