-- Confirmation number removed from hotel details (only the confirmation status is kept).
ALTER TABLE "BookingService" DROP COLUMN "hotelConfirmationRef";
