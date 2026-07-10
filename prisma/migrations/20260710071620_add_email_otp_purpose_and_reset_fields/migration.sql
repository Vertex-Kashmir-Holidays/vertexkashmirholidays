-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'RESET');

-- AlterTable
ALTER TABLE "EmailOtp" ADD COLUMN     "purpose" "OtpPurpose" NOT NULL DEFAULT 'REGISTER',
ADD COLUMN     "resetTokenHash" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;
