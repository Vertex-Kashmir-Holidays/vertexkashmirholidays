import { prisma } from "@/lib/prisma";
import type { HotelConfirmation } from "@prisma/client";

export interface HotelLinkFields {
  hotelSupplierId?: string | null;
  hotelConfirmation?: HotelConfirmation | null;
  hotelConfirmedAt?: Date | null;
}

/**
 * Map typed hotel names → HotelSupplier ids, linking only names that match
 * exactly ONE hotel in the list (case/space-insensitive) — the same rule as the
 * one-time backfill in migration 20261106090000_booking_service_hotel_link.
 */
export async function matchHotelSupplierIds(
  db: Pick<typeof prisma, "hotelSupplier">,
  names: string[],
): Promise<Map<string, string>> {
  const keys = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))];
  const out = new Map<string, string>();
  if (keys.length === 0) return out;
  const rows = await db.hotelSupplier.findMany({ select: { id: true, hotelName: true } });
  const byKey = new Map<string, string[]>();
  for (const r of rows) {
    const k = r.hotelName.trim().toLowerCase();
    byKey.set(k, [...(byKey.get(k) ?? []), r.id]);
  }
  for (const k of keys) {
    const ids = byKey.get(k);
    if (ids?.length === 1) out.set(k, ids[0]);
  }
  return out;
}

/**
 * Hotel-link + confirmation fields for a BookingService write, shared by the
 * create (POST) and update (PATCH) service routes. Returns an error message
 * when the linked hotel does not exist; `hotelConfirmedAt` is stamped only on
 * a transition INTO Confirmed (and cleared when it moves away).
 */
export async function hotelLinkData(
  d: {
    hotelSupplierId?: string | null;
    hotelConfirmation?: HotelConfirmation | null;
  },
  previous: HotelConfirmation | null = null,
): Promise<{ data: HotelLinkFields } | { error: string }> {
  const data: HotelLinkFields = {};
  if (d.hotelSupplierId !== undefined) {
    if (d.hotelSupplierId) {
      const exists = await prisma.hotelSupplier.findUnique({
        where: { id: d.hotelSupplierId },
        select: { id: true },
      });
      if (!exists) return { error: "Selected hotel no longer exists in the hotel list." };
    }
    data.hotelSupplierId = d.hotelSupplierId;
  }
  if (d.hotelConfirmation !== undefined) {
    data.hotelConfirmation = d.hotelConfirmation;
    if (d.hotelConfirmation === "CONFIRMED" && previous !== "CONFIRMED") data.hotelConfirmedAt = new Date();
    if (d.hotelConfirmation !== "CONFIRMED") data.hotelConfirmedAt = null;
  }
  return { data };
}
