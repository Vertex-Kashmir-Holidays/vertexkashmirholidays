-- The 20260815212416_add_employee_personal_details migration was committed with an
-- empty migration.sql and is already marked applied, so it never created these columns.
-- This migration adds what that one was supposed to.
ALTER TABLE "User" ADD COLUMN "personalEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "personalPhone" TEXT;
ALTER TABLE "User" ADD COLUMN "address" TEXT;
