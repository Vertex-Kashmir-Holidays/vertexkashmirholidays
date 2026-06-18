-- ============================================================
-- Phase 2: Inquiry → Lead migration
-- Hand-edited from prisma migrate diff output.
-- Key changes vs generated order:
--   1. Newsletter-polluted rows removed before data migration.
--   2. Lead table created BEFORE Inquiry is dropped.
--   3. Data migrated from Inquiry → Lead with status and source mapping.
--   4. Inquiry dropped AFTER data is safely in Lead.
--   5. Orphaned RolePermission rows for "inquiries" deleted.
-- ============================================================

-- Step 1: Remove newsletter fake rows so they do not become leads.
-- These rows have phone = 'newsletter' (written by /api/newsletter before Phase 1).
DELETE FROM "Inquiry" WHERE phone = 'newsletter' OR source = 'newsletter';

-- Step 2: Create new enum types.
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONNECTED', 'NOT_CONNECTED', 'QUALIFIED', 'NEGOTIATION', 'ON_HOLD', 'CONVERTED', 'REJECTED');
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'MANUAL', 'GOOGLE_ADS', 'META_ADS', 'THIRD_PARTY', 'REFERRAL');
CREATE TYPE "LeadCategory" AS ENUM ('HONEYMOON_TOUR', 'COUPLE', 'FAMILY_TOUR', 'GROUP_TOUR', 'SKI_TOUR', 'OFFBEAT_TOUR');
CREATE TYPE "LeadActivityType" AS ENUM ('STATUS_CHANGE', 'ASSIGNMENT_CHANGE', 'NOTE_ADDED', 'FOLLOW_UP_SCHEDULED', 'ATTACHMENT_ADDED', 'CALL_LOGGED', 'EMAIL_SENT');

-- Step 3: Create Lead table (before data migration, before dropping Inquiry).
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE',
    "category" "LeadCategory",
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "assignedToId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Step 4: Migrate all remaining Inquiry rows into Lead.
--   travelDate  → startDate
--   travellers  → adults  (COALESCE to 1 when null)
--   message     → notes
--   status:     CONTACTED → CONNECTED, CLOSED → REJECTED, others preserved
--   source:     free-form string → nearest LeadSource enum value
INSERT INTO "Lead" (
    "id", "name", "phone", "email",
    "source", "adults", "startDate", "notes", "status",
    "createdAt", "updatedAt"
)
SELECT
    id,
    name,
    phone,
    email,
    CASE
        WHEN lower(coalesce(source, 'website')) LIKE '%google%'                         THEN 'GOOGLE_ADS'::"LeadSource"
        WHEN lower(coalesce(source, 'website')) LIKE '%meta%'
          OR lower(coalesce(source, 'website')) LIKE '%facebook%'
          OR lower(coalesce(source, 'website')) LIKE '%instagram%'                       THEN 'META_ADS'::"LeadSource"
        WHEN lower(coalesce(source, 'website')) = 'referral'                             THEN 'REFERRAL'::"LeadSource"
        ELSE                                                                              'WEBSITE'::"LeadSource"
    END,
    COALESCE(travellers, 1),
    "travelDate",
    message,
    CASE status::text
        WHEN 'NEW'       THEN 'NEW'::"LeadStatus"
        WHEN 'CONTACTED' THEN 'CONNECTED'::"LeadStatus"
        WHEN 'CONVERTED' THEN 'CONVERTED'::"LeadStatus"
        WHEN 'CLOSED'    THEN 'REJECTED'::"LeadStatus"
        ELSE                  'NEW'::"LeadStatus"
    END,
    "createdAt",
    "updatedAt"
FROM "Inquiry";

-- Step 5: Create LeadActivity table.
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "note" TEXT,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus",
    "fromAssigneeId" TEXT,
    "toAssigneeId" TEXT,
    "performedById" TEXT,
    "performedByName" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- Step 6: Indexes on Lead.
CREATE INDEX "Lead_status_idx"      ON "Lead"("status");
CREATE INDEX "Lead_source_idx"      ON "Lead"("source");
CREATE INDEX "Lead_category_idx"    ON "Lead"("category");
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");
CREATE INDEX "Lead_createdAt_idx"   ON "Lead"("createdAt");

-- Step 7: Indexes on LeadActivity.
CREATE INDEX "LeadActivity_leadId_idx"     ON "LeadActivity"("leadId");
CREATE INDEX "LeadActivity_performedAt_idx" ON "LeadActivity"("performedAt");

-- Step 8: Foreign key constraints.
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Drop Inquiry table — data is safely in Lead.
DROP TABLE "Inquiry";

-- Step 10: Drop old InquiryStatus enum.
DROP TYPE "InquiryStatus";

-- Step 11: Remove orphaned RolePermission rows for the old "inquiries" module key.
--   SUPERADMIN bypasses the table; ADMIN/SALES/EDITOR rows for "inquiries" are stale.
--   New "leads" rows are written by yarn db:seed after this migration.
DELETE FROM "RolePermission" WHERE module = 'inquiries';
