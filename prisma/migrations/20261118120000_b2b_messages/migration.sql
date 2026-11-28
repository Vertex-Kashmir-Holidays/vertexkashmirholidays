-- CreateTable
CREATE TABLE "B2bMessage" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachmentName" TEXT,
    "requestId" TEXT,
    "recipients" JSONB NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "sentById" TEXT,
    "sentByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2bMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "B2bMessage_createdAt_idx" ON "B2bMessage"("createdAt");

-- CreateIndex
CREATE INDEX "B2bMessage_requestId_idx" ON "B2bMessage"("requestId");

-- AddForeignKey
ALTER TABLE "B2bMessage" ADD CONSTRAINT "B2bMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
