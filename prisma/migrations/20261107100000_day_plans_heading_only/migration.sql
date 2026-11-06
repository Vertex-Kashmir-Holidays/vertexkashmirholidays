-- Destinations Library keeps only the day heading + description per route;
-- picking a plan never changes a day's stay, meals, highlights or photo.
ALTER TABLE "DayPlan" DROP COLUMN "stay",
DROP COLUMN "meals",
DROP COLUMN "highlights",
DROP COLUMN "image";
