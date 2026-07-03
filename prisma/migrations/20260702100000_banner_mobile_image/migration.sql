-- Add a separate mobile background image for PROMO banners (falls back to imageUrl).
ALTER TABLE "Banner" ADD COLUMN "imageMobileUrl" TEXT;
