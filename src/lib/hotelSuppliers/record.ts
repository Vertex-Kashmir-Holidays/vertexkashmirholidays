import type { HotelSupplier } from "@prisma/client";
import type { HotelSupplierRecord } from "@/components/admin/hotel-suppliers/HotelSuppliersClient";
import { hotelDataSchema, type HotelData } from "@/lib/hotelSuppliers/schema";
import type { HotelStayStats } from "@/lib/trips/board";

const EMPTY_DATA: HotelData = {
  property: {
    location: null,
    contactPerson: null,
    phone: null,
    email: null,
    mapUrl: null,
    services: null,
  },
  rate: null,
  rating: null,
};

/**
 * A HotelSupplier row → the client record used by the Hotel Rates table and the
 * hotel's own page (same shape, so both can reuse the same editors).
 */
export function toHotelSupplierRecord(
  row: HotelSupplier,
  stayStats: Record<string, HotelStayStats>,
): HotelSupplierRecord {
  const parsed = hotelDataSchema.safeParse(row.data);
  return {
    id: row.id,
    hotelName: row.hotelName,
    destination: row.destination,
    category: row.category,
    isActive: row.isActive,
    recommended: row.recommended,
    hasFamilyRoom: row.hasFamilyRoom,
    confirmedStays: stayStats[row.id]?.stays ?? 0,
    roomNights: stayStats[row.id]?.roomNights ?? 0,
    lastStay: stayStats[row.id]?.lastStay ?? null,
    lastRateRequestSentAt: row.lastRateRequestSentAt
      ? row.lastRateRequestSentAt.toISOString()
      : null,
    data: parsed.success ? parsed.data : EMPTY_DATA,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    coverImageUrl: row.coverImageUrl,
    roomImageUrl: row.roomImageUrl,
    showOnWebsite: row.showOnWebsite,
    publicLikeCount: row.publicLikeCount,
  };
}
