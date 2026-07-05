-- Independent OG/Twitter title/description overrides on Blog, matching the
-- Tour.ogTitle/ogDescription convention.
ALTER TABLE "Blog" ADD COLUMN "ogTitle" TEXT;
ALTER TABLE "Blog" ADD COLUMN "ogDescription" TEXT;
