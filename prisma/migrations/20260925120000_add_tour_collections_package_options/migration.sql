-- AlterEnum
ALTER TYPE "TourRegion" ADD VALUE 'HIMACHAL';

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "packageOptions" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "packageName" TEXT;

-- CreateTable
CREATE TABLE "TourCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "intro" TEXT,
    "content" TEXT,
    "heroImage" TEXT,
    "heroImageMobile" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TourToTourCollection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TourToTourCollection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FaqToTourCollection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FaqToTourCollection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "TourCollection_slug_key" ON "TourCollection"("slug");

-- CreateIndex
CREATE INDEX "TourCollection_published_sortOrder_idx" ON "TourCollection"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "_TourToTourCollection_B_index" ON "_TourToTourCollection"("B");

-- CreateIndex
CREATE INDEX "_FaqToTourCollection_B_index" ON "_FaqToTourCollection"("B");

-- AddForeignKey
ALTER TABLE "_TourToTourCollection" ADD CONSTRAINT "_TourToTourCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TourToTourCollection" ADD CONSTRAINT "_TourToTourCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "TourCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FaqToTourCollection" ADD CONSTRAINT "_FaqToTourCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "Faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FaqToTourCollection" ADD CONSTRAINT "_FaqToTourCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "TourCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

