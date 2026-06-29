-- AlterTable ChatRoom: add directKey for dedup-safe DM creation (nullable unique, null for GROUP rooms)
ALTER TABLE "ChatRoom" ADD COLUMN "directKey" TEXT;
CREATE UNIQUE INDEX "ChatRoom_directKey_key" ON "ChatRoom"("directKey");
