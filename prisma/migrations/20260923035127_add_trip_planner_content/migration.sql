-- CreateTable
CREATE TABLE "TripPlannerContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroKicker" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "tourKicker" TEXT,
    "tourTitle" TEXT,
    "tourSubtitle" TEXT,
    "pricingTitle" TEXT,
    "pricingBody" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripPlannerContent_pkey" PRIMARY KEY ("id")
);
