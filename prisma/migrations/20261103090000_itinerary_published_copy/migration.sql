-- Client-visible itinerary snapshot: customers and B2B agents read
-- publishedData, never the live `data` staff are still editing.
ALTER TABLE "Itinerary" ADD COLUMN "publishedTitle" TEXT;
ALTER TABLE "Itinerary" ADD COLUMN "publishedData" JSONB;
ALTER TABLE "Itinerary" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Keep today's behaviour for everything clients can already see: an
-- itinerary past DRAFT was visible with its current content, so publish
-- exactly that. DRAFT itineraries stay unpublished (they were hidden already).
UPDATE "Itinerary"
SET "publishedTitle" = "title",
    "publishedData"  = "data",
    "publishedAt"    = "updatedAt"
WHERE "status" <> 'DRAFT';
