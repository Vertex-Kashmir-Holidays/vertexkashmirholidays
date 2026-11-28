-- AlterTable
ALTER TABLE "AdminDocument" ADD COLUMN     "agentId" TEXT;

-- CreateIndex
CREATE INDEX "AdminDocument_agentId_idx" ON "AdminDocument"("agentId");

-- AddForeignKey
ALTER TABLE "AdminDocument" ADD CONSTRAINT "AdminDocument_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

