-- AlterTable
ALTER TABLE "OccasionOffer" ADD COLUMN     "compareRows" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "OccasionOfferPackage" ADD COLUMN     "compareValues" TEXT NOT NULL DEFAULT '{}';

