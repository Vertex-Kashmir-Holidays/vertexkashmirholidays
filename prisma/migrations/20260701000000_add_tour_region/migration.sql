-- CreateEnum
CREATE TYPE "TourRegion" AS ENUM ('KASHMIR', 'LADAKH');

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN "region" "TourRegion" NOT NULL DEFAULT 'KASHMIR';

-- CreateIndex
CREATE INDEX "Tour_region_idx" ON "Tour"("region");
