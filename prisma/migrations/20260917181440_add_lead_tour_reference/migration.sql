-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "tourId" TEXT;

-- CreateIndex
CREATE INDEX "Lead_tourId_idx" ON "Lead"("tourId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;
