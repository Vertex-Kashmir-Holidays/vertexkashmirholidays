-- CreateEnum
CREATE TYPE "OccasionType" AS ENUM ('DIWALI', 'CHRISTMAS', 'NEW_YEAR', 'EID', 'HOLI', 'SUMMER', 'OTHER');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "occasionOfferId" TEXT;

-- CreateTable
CREATE TABLE "OccasionOffer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "occasionType" "OccasionType" NOT NULL DEFAULT 'OTHER',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "durationLabel" TEXT,
    "shortDescription" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "heroImageMobile" TEXT,
    "ctaLabel" TEXT,
    "overview" TEXT,
    "whyThisOffer" TEXT NOT NULL DEFAULT '[]',
    "itinerary" TEXT NOT NULL DEFAULT '[]',
    "inclusions" TEXT NOT NULL DEFAULT '[]',
    "exclusions" TEXT NOT NULL DEFAULT '[]',
    "experiences" TEXT NOT NULL DEFAULT '[]',
    "faqs" TEXT NOT NULL DEFAULT '[]',
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDesc" TEXT,
    "ogImage" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccasionOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccasionOfferPackage" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceForTwo" INTEGER NOT NULL,
    "originalPriceForTwo" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "highlights" TEXT NOT NULL DEFAULT '[]',
    "inclusions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccasionOfferPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OccasionOfferToTour" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OccasionOfferToTour_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "OccasionOffer_slug_key" ON "OccasionOffer"("slug");

-- CreateIndex
CREATE INDEX "OccasionOffer_published_sortOrder_idx" ON "OccasionOffer"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "OccasionOfferPackage_offerId_sortOrder_idx" ON "OccasionOfferPackage"("offerId", "sortOrder");

-- CreateIndex
CREATE INDEX "_OccasionOfferToTour_B_index" ON "_OccasionOfferToTour"("B");

-- CreateIndex
CREATE INDEX "Lead_occasionOfferId_idx" ON "Lead"("occasionOfferId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_occasionOfferId_fkey" FOREIGN KEY ("occasionOfferId") REFERENCES "OccasionOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccasionOfferPackage" ADD CONSTRAINT "OccasionOfferPackage_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "OccasionOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OccasionOfferToTour" ADD CONSTRAINT "_OccasionOfferToTour_A_fkey" FOREIGN KEY ("A") REFERENCES "OccasionOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OccasionOfferToTour" ADD CONSTRAINT "_OccasionOfferToTour_B_fkey" FOREIGN KEY ("B") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

