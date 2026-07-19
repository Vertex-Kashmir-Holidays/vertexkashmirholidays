-- Careers module (VERTE-97 + VERTE-98), squashed into one migration per
-- project convention (one migration file per module rather than one per
-- ticket). Purely additive — new enum, new table, one new enum value on an
-- existing enum.
--
-- Originally generated as two separate migrations via `prisma migrate diff`
-- against the live dev database (not `prisma migrate dev`), because this
-- branch lineage doesn't have the AuditLog model that a separate,
-- still-unmerged branch (VERTE-17) already applied directly to the same
-- shared dev database — the raw diff output both times included
-- `DROP TABLE "AuditLog"` / `DROP TYPE "AuditAction"`, cross-branch noise
-- excluded from both. Squashed here since VERTE-97 hadn't merged to dev yet,
-- so no downstream environment has applied the two separate files.

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "experience" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "salary" TEXT,
    "shortDescription" TEXT NOT NULL,
    "aboutRole" TEXT NOT NULL,
    "responsibilities" TEXT NOT NULL DEFAULT '[]',
    "requirements" TEXT NOT NULL DEFAULT '[]',
    "preferredSkills" TEXT NOT NULL DEFAULT '[]',
    "benefits" TEXT NOT NULL DEFAULT '[]',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_slug_key" ON "Job"("slug");

-- CreateIndex
CREATE INDEX "Job_published_idx" ON "Job"("published");

-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'CAREERS';
