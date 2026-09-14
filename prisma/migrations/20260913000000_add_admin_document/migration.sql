-- CreateTable
CREATE TABLE "AdminDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "uploadedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminDocument_category_idx" ON "AdminDocument"("category");

-- CreateIndex
CREATE INDEX "AdminDocument_createdAt_idx" ON "AdminDocument"("createdAt");
