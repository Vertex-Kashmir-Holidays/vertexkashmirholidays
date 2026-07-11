-- CreateTable
CREATE TABLE "ReviewsContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroBreadcrumb" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "heroImageMobile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewsContent_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "googlePlaceId" TEXT,
ADD COLUMN     "tripadvisorWidgetEmbed" TEXT;
