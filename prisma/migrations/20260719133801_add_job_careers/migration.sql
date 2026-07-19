-- Careers Ticket 1: Job model + EmploymentType enum. Purely additive.
-- Generated via `prisma migrate diff` against the live dev database rather
-- than `prisma migrate dev`, because this branch (VERTE-feature-careers-1)
-- was cut from `dev` and doesn't have the AuditLog model that a separate,
-- still-unmerged branch (VERTE-17) already applied directly to this same
-- shared dev database — the raw diff output included `DROP TABLE "AuditLog"`
-- / `DROP TYPE "AuditAction"`, which is cross-branch noise, not a real
-- schema change this migration should make. Those two statements were
-- excluded; only the genuine Job/EmploymentType additions are below.

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
