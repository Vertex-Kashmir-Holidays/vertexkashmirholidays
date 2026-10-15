-- CreateEnum
CREATE TYPE "ActivityPriceUnit" AS ENUM ('PER_PERSON', 'PER_BOAT', 'PER_VEHICLE', 'PER_HOUR', 'PER_GROUP');

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "priceUnit" "ActivityPriceUnit" NOT NULL DEFAULT 'PER_PERSON';
