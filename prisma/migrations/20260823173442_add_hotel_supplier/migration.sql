-- Hotel Suppliers & Rates: internal supplier/rate reference for Sales quoting.
-- Purely additive — new enum + new standalone table, no changes to existing
-- columns/tables, and no FK ties into Booking/Lead/Itinerary. Generated via
-- `prisma migrate diff` against the live dev database rather than
-- `prisma migrate dev`, because the dev DB's migration history currently
-- fails shadow-database replay at an unrelated earlier migration
-- (20260815212416_add_employee_personal_details is applied on the live DB
-- but has no matching local migration folder) — a pre-existing
-- inconsistency, not something introduced by this change. Same workaround
-- already used by 20260719095738_add_audit_log for the same reason.

-- CreateEnum
CREATE TYPE "HotelCategory" AS ENUM ('BUDGET', 'DELUXE', 'PREMIUM');

-- CreateTable
CREATE TABLE "HotelSupplier" (
    "id" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "category" "HotelCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HotelSupplier_destination_idx" ON "HotelSupplier"("destination");

-- CreateIndex
CREATE INDEX "HotelSupplier_category_idx" ON "HotelSupplier"("category");

-- CreateIndex
CREATE INDEX "HotelSupplier_isActive_idx" ON "HotelSupplier"("isActive");
