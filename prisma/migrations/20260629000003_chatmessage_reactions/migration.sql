-- Add emoji reactions (JSON string) and updatedAt tracking to ChatMessage
ALTER TABLE "ChatMessage" ADD COLUMN "reactions" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
