-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "budgetBandDerived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WhatsAppAttributionToken" ADD COLUMN     "budgetBandDerived" BOOLEAN NOT NULL DEFAULT false;

-- Budget is now asked PER PERSON. Retire the four "for 2" bands — kept (never
-- deleted) with their labels unchanged, since old leads reference their keys —
-- and add the contiguous per-person bands. Each active band ends ₹1 below the
-- next one's start; the last is open-ended.
UPDATE "BudgetBand" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" IN ('band1', 'band2', 'band3', 'band4');

INSERT INTO "BudgetBand" ("id", "key", "label", "minAmount", "maxAmount", "sortOrder", "isActive", "updatedAt") VALUES
  ('budget_band5', 'band5', '₹9,000 – ₹13,999', 9000, 13999, 1, true, CURRENT_TIMESTAMP),
  ('budget_band6', 'band6', '₹14,000 – ₹16,999', 14000, 16999, 2, true, CURRENT_TIMESTAMP),
  ('budget_band7', 'band7', '₹17,000 – ₹21,999', 17000, 21999, 3, true, CURRENT_TIMESTAMP),
  ('budget_band8', 'band8', '₹22,000 – ₹27,999', 22000, 27999, 4, true, CURRENT_TIMESTAMP),
  ('budget_band9', 'band9', '₹28,000+', 28000, NULL, 5, true, CURRENT_TIMESTAMP);
