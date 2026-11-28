-- Day Plans library: ready-written itinerary days per route, picked into proposals.
CREATE TYPE "DayPlanSeason" AS ENUM ('ALL_YEAR', 'SUMMER', 'WINTER');

CREATE TABLE "DayPlan" (
    "id" TEXT NOT NULL,
    "fromPlace" TEXT NOT NULL,
    "toPlace" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "stay" TEXT NOT NULL DEFAULT '',
    "meals" TEXT NOT NULL DEFAULT '',
    "highlights" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "season" "DayPlanSeason" NOT NULL DEFAULT 'ALL_YEAR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DayPlan_fromPlace_toPlace_idx" ON "DayPlan"("fromPlace", "toPlace");
