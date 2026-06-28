-- AlterTable ChatMember: add typingAt for typing indicator support
ALTER TABLE "ChatMember" ADD COLUMN "typingAt" TIMESTAMP(3);
