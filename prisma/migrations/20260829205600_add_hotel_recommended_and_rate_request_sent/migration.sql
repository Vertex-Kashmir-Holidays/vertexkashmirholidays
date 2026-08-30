-- AlterTable
ALTER TABLE "HotelSupplier" ADD COLUMN     "lastRateRequestSentAt" TIMESTAMP(3),
ADD COLUMN     "recommended" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "HotelSupplier_recommended_idx" ON "HotelSupplier"("recommended");
