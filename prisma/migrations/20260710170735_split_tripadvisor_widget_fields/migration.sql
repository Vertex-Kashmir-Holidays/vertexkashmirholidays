-- RenameColumn
ALTER TABLE "SiteSettings" RENAME COLUMN "tripadvisorWidgetEmbed" TO "tripadvisorHeroWidgetEmbed";

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "tripadvisorRatingWidgetEmbed" TEXT;
