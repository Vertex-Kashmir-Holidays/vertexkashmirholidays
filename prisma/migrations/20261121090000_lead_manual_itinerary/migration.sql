-- Manual itinerary PDF + staff-only artifact link per lead / B2B request.
ALTER TABLE "Lead" ADD COLUMN "manualItineraryUrl" TEXT,
ADD COLUMN "manualItineraryName" TEXT,
ADD COLUMN "manualItineraryAt" TIMESTAMP(3),
ADD COLUMN "itineraryArtifactUrl" TEXT;
