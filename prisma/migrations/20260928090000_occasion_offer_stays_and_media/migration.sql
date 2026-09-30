-- AlterTable
ALTER TABLE "OccasionOffer" DROP COLUMN "durationLabel",
DROP COLUMN "experiences",
ADD COLUMN     "filmPoster" TEXT,
ADD COLUMN     "filmUrl" TEXT,
ADD COLUMN     "gallery" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "OccasionOfferPackage" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "mealPlan" TEXT,
ADD COLUMN     "stays" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "vehicle" TEXT;

