-- AlterTable
ALTER TABLE "BookingService" ADD COLUMN     "vehicles" INTEGER;

-- CreateTable
CREATE TABLE "BookingDriver" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingDriver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingDriver_bookingId_idx" ON "BookingDriver"("bookingId");

-- AddForeignKey
ALTER TABLE "BookingDriver" ADD CONSTRAINT "BookingDriver_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy each booking's existing single driver into the new table (the legacy
-- Booking.driver*/vehicle* columns stay for now and are no longer used).
INSERT INTO "BookingDriver" ("id", "bookingId", "driverName", "driverPhone", "vehicleName", "vehicleNumber", "sortOrder", "createdAt")
SELECT 'drv_' || "id", "id", "driverName", COALESCE("driverPhone", ''), COALESCE("vehicleName", ''), COALESCE("vehicleNumber", ''), 0, COALESCE("driverAddedAt", CURRENT_TIMESTAMP)
FROM "Booking"
WHERE "driverName" IS NOT NULL AND btrim("driverName") <> '';
