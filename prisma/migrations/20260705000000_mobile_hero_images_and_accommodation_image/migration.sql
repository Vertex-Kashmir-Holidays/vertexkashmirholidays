-- Add a dedicated Accommodation section image on Tour, and mobile-specific
-- cover image variants on the four detail-page models that were still
-- missing one (Tour, Destination, Blog, Activity) — matching the existing
-- heroImage/heroImageMobile convention already used elsewhere (HomeSection,
-- ContactContent, AboutContent, BlogContent, Campaign, LegalPage, HeroSlide).
ALTER TABLE "Tour" ADD COLUMN "accommodationImage" TEXT;
ALTER TABLE "Tour" ADD COLUMN "coverImageMobile" TEXT;
ALTER TABLE "Destination" ADD COLUMN "coverImageMobile" TEXT;
ALTER TABLE "Blog" ADD COLUMN "coverImageMobile" TEXT;
ALTER TABLE "Activity" ADD COLUMN "coverImageMobile" TEXT;
