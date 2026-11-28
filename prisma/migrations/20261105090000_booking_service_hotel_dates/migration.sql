-- Hotel booking facts on BookingService (rooms + check-in/out dates), printed
-- on the customer's booking summary. Nullable: existing services stay blank.
ALTER TABLE "BookingService" ADD COLUMN "rooms" INTEGER;
ALTER TABLE "BookingService" ADD COLUMN "checkIn" DATE;
ALTER TABLE "BookingService" ADD COLUMN "checkOut" DATE;
