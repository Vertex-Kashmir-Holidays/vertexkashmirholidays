-- SiteSettings: add legal/business identity fields (legal name, tourism
-- registration number, structured address) — distinct from the existing
-- brand-level siteName/siteAddress.
ALTER TABLE "SiteSettings" ADD COLUMN "legalName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "tourismRegNumber" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "addressLine1" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "addressCity" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "addressState" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "addressPincode" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "addressCountry" TEXT;
