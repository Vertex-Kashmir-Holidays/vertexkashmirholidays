-- Link booking hotel services to the hotel list + track confirmation with the hotel.
CREATE TYPE "HotelConfirmation" AS ENUM ('PENDING', 'REQUESTED', 'CONFIRMED', 'CANCELLED');

ALTER TABLE "BookingService" ADD COLUMN "hotelSupplierId" TEXT;
ALTER TABLE "BookingService" ADD COLUMN "hotelConfirmation" "HotelConfirmation";
ALTER TABLE "BookingService" ADD COLUMN "hotelConfirmationRef" TEXT;
ALTER TABLE "BookingService" ADD COLUMN "hotelConfirmedAt" TIMESTAMP(3);

CREATE INDEX "BookingService_hotelSupplierId_idx" ON "BookingService"("hotelSupplierId");

ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_hotelSupplierId_fkey"
  FOREIGN KEY ("hotelSupplierId") REFERENCES "HotelSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One-time backfill: link existing hotel rows whose typed name exactly matches
-- (case/space-insensitive) exactly ONE hotel in the list. Ambiguous or
-- unmatched names stay unlinked and keep showing by their typed name.
UPDATE "BookingService" bs
SET "hotelSupplierId" = m.id
FROM (
  SELECT lower(trim("hotelName")) AS key, min(id) AS id
  FROM "HotelSupplier"
  GROUP BY lower(trim("hotelName"))
  HAVING count(*) = 1
) m
WHERE bs.kind = 'HOTEL'
  AND bs."hotelSupplierId" IS NULL
  AND lower(trim(bs.name)) = m.key;
