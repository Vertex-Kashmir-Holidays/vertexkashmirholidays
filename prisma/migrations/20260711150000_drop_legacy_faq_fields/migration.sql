-- Phase 6: remove legacy FAQ storage, now superseded by the centralized Faq module.
-- All existing data in these columns/table was migrated into `Faq` in Phase 2/3.

-- DropTable
DROP TABLE "ContactFaq";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "faqs";

-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "faqs";

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "faqs";

-- AlterTable
ALTER TABLE "Destination" DROP COLUMN "faqs";

-- AlterTable
ALTER TABLE "Tour" DROP COLUMN "faqs";
