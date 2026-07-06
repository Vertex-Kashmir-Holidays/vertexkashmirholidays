-- Additive fields for the Destination module content build-out
ALTER TABLE "Destination"
  ADD COLUMN "whyVisit" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "topAttractions" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "bestTimeDetail" TEXT,
  ADD COLUMN "howToReach" TEXT,
  ADD COLUMN "whereToStay" TEXT,
  ADD COLUMN "localFood" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "shopping" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "travelTips" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "faqs" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "relatedBlogIds" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "ogTitle" TEXT,
  ADD COLUMN "ogDescription" TEXT;
