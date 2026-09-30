-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "theme",
ADD COLUMN     "contentBackground" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "BannerTheme";

