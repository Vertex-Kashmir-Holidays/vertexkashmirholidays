-- Add minPersons to Tour (default 1 — no minimum for existing tours)
ALTER TABLE "Tour" ADD COLUMN "minPersons" INTEGER NOT NULL DEFAULT 1;
