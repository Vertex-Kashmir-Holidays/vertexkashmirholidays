-- AlterTable
ALTER TABLE "OccasionOffer" ADD COLUMN     "activities" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "activitiesIntro" TEXT,
ADD COLUMN     "activitiesNote" TEXT,
ADD COLUMN     "activitiesTitle" TEXT;

