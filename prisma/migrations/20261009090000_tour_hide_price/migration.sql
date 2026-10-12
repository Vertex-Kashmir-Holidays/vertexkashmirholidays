-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "hidePrice" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "mentionsPrice" BOOLEAN NOT NULL DEFAULT false;

-- One-time pre-tick: the FAQs whose answers refer to the package price
-- (reviewed by hand; the "how much extra should I budget on the ground"
-- questions are about on-ground spending and stay unticked). A no-op on any
-- database that doesn't have these exact questions.
UPDATE "Faq" SET "mentionsPrice" = true WHERE "question" IN (
  'What is included in the price, and are there extras later?',
  'How do I book, and how much do I pay now?',
  'The price is for three people minimum — what if we are four or five?',
  'What do I get for the premium price?'
);
