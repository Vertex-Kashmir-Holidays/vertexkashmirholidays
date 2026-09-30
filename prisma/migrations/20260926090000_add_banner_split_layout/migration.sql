-- CreateEnum
CREATE TYPE "BannerLayout" AS ENUM ('OVERLAY', 'SPLIT');

-- CreateEnum
CREATE TYPE "BannerTheme" AS ENUM ('LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "features" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "kicker" TEXT,
ADD COLUMN     "layout" "BannerLayout" NOT NULL DEFAULT 'OVERLAY',
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "theme" "BannerTheme" NOT NULL DEFAULT 'LIGHT';

