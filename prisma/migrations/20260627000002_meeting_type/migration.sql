-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('AUDIO', 'VIDEO');

-- AlterTable Meeting: add type column
ALTER TABLE "Meeting" ADD COLUMN "type" "MeetingType" NOT NULL DEFAULT 'AUDIO';

-- AlterTable MeetingParticipant: add joinedAt and leftAt
ALTER TABLE "MeetingParticipant" ADD COLUMN "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "MeetingParticipant" ADD COLUMN "leftAt" TIMESTAMP(3);
