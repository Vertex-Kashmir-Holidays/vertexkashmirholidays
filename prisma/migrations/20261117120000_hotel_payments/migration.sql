-- CreateEnum
CREATE TYPE "HotelPaymentType" AS ENUM ('TOKEN', 'BALANCE');

-- AlterTable
ALTER TABLE "BookingService" ADD COLUMN     "hotelTokenWaived" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "HotelPayment" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "HotelPaymentType" NOT NULL,
    "method" TEXT NOT NULL,
    "paidBy" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "emailedTo" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HotelPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HotelPayment_serviceId_idx" ON "HotelPayment"("serviceId");

-- AddForeignKey
ALTER TABLE "HotelPayment" ADD CONSTRAINT "HotelPayment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "BookingService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
