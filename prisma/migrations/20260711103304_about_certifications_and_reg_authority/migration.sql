    -- AlterTable
    ALTER TABLE "SiteSettings" ADD COLUMN "tourismRegAuthority" TEXT;

    -- CreateTable
    CREATE TABLE "Certification" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "subtitle" TEXT NOT NULL,
        "icon" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
    );

    -- CreateIndex
    CREATE INDEX "Certification_isActive_sortOrder_idx" ON "Certification"("isActive", "sortOrder");
