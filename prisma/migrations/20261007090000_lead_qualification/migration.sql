-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "budgetBandKey" TEXT,
ADD COLUMN     "budgetBandLabel" TEXT,
ADD COLUMN     "travelMonth" TEXT;

-- AlterTable
ALTER TABLE "WhatsAppAttributionToken" ADD COLUMN     "budgetBandKey" TEXT,
ADD COLUMN     "budgetBandLabel" TEXT,
ADD COLUMN     "travelMonth" TEXT,
ADD COLUMN     "waOpenedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BudgetBand" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minAmount" INTEGER NOT NULL,
    "maxAmount" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetBand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetBand_key_key" ON "BudgetBand"("key");

-- CreateIndex
CREATE INDEX "Lead_budgetBandKey_idx" ON "Lead"("budgetBandKey");

-- Seed the four launch bands (budget for 2 persons). Admin-editable afterwards;
-- deactivate, never delete.
INSERT INTO "BudgetBand" ("id", "key", "label", "minAmount", "maxAmount", "sortOrder", "isActive", "updatedAt") VALUES
  ('budget_band1', 'band1', '₹21,000 – ₹34,000', 21000, 34000, 1, true, CURRENT_TIMESTAMP),
  ('budget_band2', 'band2', '₹35,000 – ₹48,000', 35000, 48000, 2, true, CURRENT_TIMESTAMP),
  ('budget_band3', 'band3', '₹49,000 – ₹64,000', 49000, 64000, 3, true, CURRENT_TIMESTAMP),
  ('budget_band4', 'band4', '₹65,000+', 65000, NULL, 4, true, CURRENT_TIMESTAMP);
