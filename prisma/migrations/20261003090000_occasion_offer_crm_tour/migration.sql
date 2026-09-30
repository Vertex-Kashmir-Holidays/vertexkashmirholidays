-- AlterTable
ALTER TABLE "OccasionOffer" ADD COLUMN     "crmTourId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OccasionOffer_crmTourId_key" ON "OccasionOffer"("crmTourId");

-- AddForeignKey
ALTER TABLE "OccasionOffer" ADD CONSTRAINT "OccasionOffer_crmTourId_fkey" FOREIGN KEY ("crmTourId") REFERENCES "Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

