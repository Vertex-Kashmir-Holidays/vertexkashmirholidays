-- Add announcement banner toggle and message to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "showAnnouncementBanner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "announcementMessage" TEXT;
