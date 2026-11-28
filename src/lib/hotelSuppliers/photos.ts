// Hotel photos shared with itineraries: a converted itinerary's hotel rows use
// the hotel's main photo, and a photo added to a hotel row in the itinerary
// editor is saved back to that hotel. Hotels are found by name with the same
// rule as bookings (matchHotelSupplierIds: exact name, exactly one match).
import { prisma } from "@/lib/prisma";
import { matchHotelSupplierIds } from "@/lib/bookings/hotelLink";

const key = (name: string) => name.trim().toLowerCase();

/** Hotel name → its main photo ("" when the hotel isn't in the list or has none). */
export async function hotelMainImages(names: string[]): Promise<Map<string, string>> {
  const ids = await matchHotelSupplierIds(prisma, names);
  const rows = await prisma.hotelSupplier.findMany({
    where: { id: { in: [...ids.values()] } },
    select: { id: true, coverImageUrl: true },
  });
  const coverById = new Map(rows.map((r) => [r.id, r.coverImageUrl ?? ""]));
  return new Map(names.map((n) => [n, coverById.get(ids.get(key(n)) ?? "") ?? ""]));
}

export type SaveHotelPhotoResult =
  | { saved: true; slot: "main" | "room" | "room 2" }
  | { saved: false; reason: "not-in-hotel-list" | "already-saved" | "all-slots-full" };

/**
 * Save `imageUrl` into the first EMPTY photo slot of the hotel named
 * `hotelName` (main → room → room 2). Never overwrites a photo already set.
 */
export async function saveHotelPhoto(hotelName: string, imageUrl: string): Promise<SaveHotelPhotoResult> {
  const id = (await matchHotelSupplierIds(prisma, [hotelName])).get(key(hotelName));
  if (!id) return { saved: false, reason: "not-in-hotel-list" };
  const hotel = await prisma.hotelSupplier.findUniqueOrThrow({
    where: { id },
    select: { coverImageUrl: true, roomImageUrl: true, roomImage2Url: true },
  });
  const slots = [
    ["coverImageUrl", "main"],
    ["roomImageUrl", "room"],
    ["roomImage2Url", "room 2"],
  ] as const;
  if (slots.some(([field]) => hotel[field] === imageUrl)) return { saved: false, reason: "already-saved" };
  const empty = slots.find(([field]) => !hotel[field]);
  if (!empty) return { saved: false, reason: "all-slots-full" };
  // Conditional on the slot still being empty, so two editors can't overwrite each other.
  const res = await prisma.hotelSupplier.updateMany({
    where: { id, OR: [{ [empty[0]]: null }, { [empty[0]]: "" }] },
    data: { [empty[0]]: imageUrl },
  });
  return res.count ? { saved: true, slot: empty[1] } : { saved: false, reason: "already-saved" };
}
