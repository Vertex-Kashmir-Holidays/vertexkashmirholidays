-- CreateEnum
CREATE TYPE "OfflineConversionPlatform" AS ENUM ('GOOGLE', 'META', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "OfflineConversionStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "fbclid" TEXT,
ADD COLUMN     "gbraid" TEXT,
ADD COLUMN     "gclid" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "landingPage" TEXT,
ADD COLUMN     "msclkid" TEXT,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT,
ADD COLUMN     "wbraid" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "fbclid" TEXT,
ADD COLUMN     "gbraid" TEXT,
ADD COLUMN     "gclid" TEXT,
ADD COLUMN     "landingPage" TEXT,
ADD COLUMN     "msclkid" TEXT,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT,
ADD COLUMN     "wbraid" TEXT;

-- CreateTable
CREATE TABLE "OfflineConversion" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "bookingId" TEXT,
    "platform" "OfflineConversionPlatform" NOT NULL,
    "status" "OfflineConversionStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "platformResponse" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflineConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfflineConversion_status_idx" ON "OfflineConversion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineConversion_leadId_platform_key" ON "OfflineConversion"("leadId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineConversion_bookingId_platform_key" ON "OfflineConversion"("bookingId", "platform");

-- AddForeignKey
ALTER TABLE "OfflineConversion" ADD CONSTRAINT "OfflineConversion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflineConversion" ADD CONSTRAINT "OfflineConversion_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

