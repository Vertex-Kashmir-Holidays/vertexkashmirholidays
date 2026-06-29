-- AlterTable Gallery: add publicId to track Cloudinary asset ID for cleanup on delete
ALTER TABLE "Gallery" ADD COLUMN "publicId" TEXT;
