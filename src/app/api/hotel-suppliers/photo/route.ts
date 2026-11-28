import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema } from "@/lib/api/route-helpers";
import { saveHotelPhoto } from "@/lib/hotelSuppliers/photos";

// A photo added to a hotel row in the itinerary editor is saved to that hotel
// (first empty slot only — see saveHotelPhoto). Itinerary editors may call it
// without hotel-list edit rights, since it can only fill an empty slot.
const bodySchema = z.object({
  hotelName: z.string().trim().min(1).max(200),
  // Uploaded / gallery images only (full URLs) — never the /itinerary/ stock photos.
  imageUrl: z.string().trim().url().max(1000),
});

export async function POST(req: NextRequest) {
  const guard = await requirePermission("itinerary", "edit");
  if (guard instanceof NextResponse) return guard;
  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(bodySchema, body.data);
  if (!parsed.ok) return parsed.response;
  return NextResponse.json(await saveHotelPhoto(parsed.data.hotelName, parsed.data.imageUrl));
}
