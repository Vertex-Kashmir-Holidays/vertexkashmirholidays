-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "paymentNote" TEXT,
ADD COLUMN     "pricingKicker" TEXT,
ADD COLUMN     "pricingTitle" TEXT,
ADD COLUMN     "formCta" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "campaignId" TEXT;

-- CreateIndex
CREATE INDEX "Lead_campaignId_idx" ON "Lead"("campaignId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
