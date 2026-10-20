-- Rename the Campaign (adventure landing pages, /adventures/[slug]) module to
-- Adventure. Pure renames — no data is copied, dropped or rewritten except the
-- module key / page tags below. NOT backward compatible: apply together with
-- the deploy of the renamed code (the old code queries "Campaign").

-- Table + its constraints/indexes
ALTER TABLE "Campaign" RENAME TO "Adventure";
ALTER TABLE "Adventure" RENAME CONSTRAINT "Campaign_pkey" TO "Adventure_pkey";
ALTER INDEX "Campaign_slug_key" RENAME TO "Adventure_slug_key";
ALTER INDEX "Campaign_published_idx" RENAME TO "Adventure_published_idx";

-- Lead → Adventure link
ALTER TABLE "Lead" RENAME COLUMN "campaignId" TO "adventureId";
ALTER TABLE "Lead" RENAME CONSTRAINT "Lead_campaignId_fkey" TO "Lead_adventureId_fkey";
ALTER INDEX "Lead_campaignId_idx" RENAME TO "Lead_adventureId_idx";

-- FAQ ↔ Adventure implicit many-to-many (A = Adventure, B = Faq — same
-- alphabetical order as before, so columns keep their meaning)
ALTER TABLE "_CampaignToFaq" RENAME TO "_AdventureToFaq";
ALTER TABLE "_AdventureToFaq" RENAME CONSTRAINT "_CampaignToFaq_AB_pkey" TO "_AdventureToFaq_AB_pkey";
ALTER TABLE "_AdventureToFaq" RENAME CONSTRAINT "_CampaignToFaq_A_fkey" TO "_AdventureToFaq_A_fkey";
ALTER TABLE "_AdventureToFaq" RENAME CONSTRAINT "_CampaignToFaq_B_fkey" TO "_AdventureToFaq_B_fkey";
ALTER INDEX "_CampaignToFaq_B_index" RENAME TO "_AdventureToFaq_B_index";

-- Stored keys that named the module
UPDATE "RolePermission" SET "module" = 'adventures' WHERE "module" = 'campaigns';
UPDATE "Lead" SET "sourcePage" = 'adventure' WHERE "sourcePage" = 'campaign';
UPDATE "Banner" SET "pages" = REPLACE("pages", '"campaigns"', '"adventures"') WHERE "pages" LIKE '%"campaigns"%';
