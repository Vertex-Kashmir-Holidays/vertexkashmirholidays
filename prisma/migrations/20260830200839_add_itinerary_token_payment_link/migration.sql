-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN     "razorpayPaymentLinkAmount" INTEGER,
ADD COLUMN     "razorpayPaymentLinkCreatedAt" TIMESTAMP(3),
ADD COLUMN     "razorpayPaymentLinkId" TEXT,
ADD COLUMN     "razorpayPaymentLinkRefId" TEXT,
ADD COLUMN     "razorpayPaymentLinkSeq" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "razorpayPaymentLinkUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Itinerary_razorpayPaymentLinkId_key" ON "Itinerary"("razorpayPaymentLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "Itinerary_razorpayPaymentLinkRefId_key" ON "Itinerary"("razorpayPaymentLinkRefId");
