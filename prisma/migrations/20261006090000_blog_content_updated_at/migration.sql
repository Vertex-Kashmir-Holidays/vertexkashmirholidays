-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "contentUpdatedAt" TIMESTAMP(3);

-- Backfill: a post's content was last changed no later than its updatedAt.
UPDATE "Blog" SET "contentUpdatedAt" = "updatedAt";
