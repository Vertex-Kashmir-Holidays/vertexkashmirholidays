-- Admin-curated "Follow Our Journey" preview grid on the Contact page (4
-- fixed image slots — replaces the previous hardcoded placeholder tiles).
-- Purely additive, all nullable, no data migration needed.

ALTER TABLE "ContactContent" ADD COLUMN "socialImage1" TEXT;
ALTER TABLE "ContactContent" ADD COLUMN "socialImage2" TEXT;
ALTER TABLE "ContactContent" ADD COLUMN "socialImage3" TEXT;
ALTER TABLE "ContactContent" ADD COLUMN "socialImage4" TEXT;
