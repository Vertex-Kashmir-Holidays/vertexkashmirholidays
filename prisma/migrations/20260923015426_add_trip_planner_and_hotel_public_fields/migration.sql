-- CreateEnum
CREATE TYPE "LeadContactChannel" AS ENUM ('FORM', 'WHATSAPP', 'PHONE');

-- AlterTable
ALTER TABLE "HotelSupplier" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "publicLikeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roomImageUrl" TEXT,
ADD COLUMN     "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "contactChannel" "LeadContactChannel",
ADD COLUMN     "fromCity" TEXT,
ADD COLUMN     "requestedComponents" TEXT,
ADD COLUMN     "toCity" TEXT,
ADD COLUMN     "transportModes" TEXT;

-- AlterTable
ALTER TABLE "WhatsAppAttributionToken" ADD COLUMN     "fromCity" TEXT,
ADD COLUMN     "requestedComponents" TEXT,
ADD COLUMN     "toCity" TEXT,
ADD COLUMN     "transportModes" TEXT;

-- CreateIndex
CREATE INDEX "HotelSupplier_showOnWebsite_idx" ON "HotelSupplier"("showOnWebsite");
