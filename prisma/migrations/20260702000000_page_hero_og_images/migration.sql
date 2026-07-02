-- HomeSection: add hero images (desktop + mobile) and ogImage for listing page heroes
ALTER TABLE "HomeSection" ADD COLUMN "heroImage"       TEXT;
ALTER TABLE "HomeSection" ADD COLUMN "heroImageMobile" TEXT;
ALTER TABLE "HomeSection" ADD COLUMN "ogImage"         TEXT;

-- BlogContent: add ogImage (heroImage/heroImageMobile already exist)
ALTER TABLE "BlogContent" ADD COLUMN "ogImage" TEXT;

-- AboutContent: add ogImage (heroImage/heroImageMobile already exist)
ALTER TABLE "AboutContent" ADD COLUMN "ogImage" TEXT;

-- ContactContent: add ogImage (heroImage/heroImageMobile already exist)
ALTER TABLE "ContactContent" ADD COLUMN "ogImage" TEXT;
