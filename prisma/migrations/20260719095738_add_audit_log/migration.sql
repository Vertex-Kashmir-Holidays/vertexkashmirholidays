-- VERTE-17: Admin Action Audit Log. Purely additive — new enum + new table,
-- no changes to existing columns/tables. Generated via `prisma migrate diff`
-- against the live dev database rather than `prisma migrate dev`, because
-- the dev DB's migration history currently fails shadow-database replay at
-- an unrelated earlier migration (20260712173655_add_performance_indexes,
-- itself already using this same diff-based workaround for the same reason)
-- — a pre-existing inconsistency, not something introduced by this change.

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ROLE_CHANGE', 'PERMISSION_EDIT', 'USER_SOFT_DELETE', 'USER_PERMANENT_DELETE', 'USER_RESTORE');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetUserId" TEXT,
    "targetUserName" TEXT,
    "targetUserEmail" TEXT,
    "performedById" TEXT,
    "performedByName" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetUserId_idx" ON "AuditLog"("targetUserId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
