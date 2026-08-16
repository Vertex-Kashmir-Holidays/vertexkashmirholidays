-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('EXPECTED', 'EARNED', 'PAID', 'REVERSED');

-- CreateTable
CREATE TABLE "BookingCommission" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "rateSnapshotPct" DOUBLE PRECISION NOT NULL,
    "profitAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CommissionStatus" NOT NULL DEFAULT 'EXPECTED',
    "earnedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paidReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingCommission_bookingId_key" ON "BookingCommission"("bookingId");

-- CreateIndex
CREATE INDEX "BookingCommission_employeeId_idx" ON "BookingCommission"("employeeId");

-- CreateIndex
CREATE INDEX "BookingCommission_status_idx" ON "BookingCommission"("status");

-- AddForeignKey
ALTER TABLE "BookingCommission" ADD CONSTRAINT "BookingCommission_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCommission" ADD CONSTRAINT "BookingCommission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
