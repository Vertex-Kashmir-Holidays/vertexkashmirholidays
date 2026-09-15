-- CreateTable
CREATE TABLE "AdminDocLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdById" TEXT,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminDocLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminDocLink_createdAt_idx" ON "AdminDocLink"("createdAt");

