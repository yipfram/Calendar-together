/*
 Warnings:
 
 - The `visibility` column on the `AvailabilityShareLink` table would be dropped and recreated. This will lead to data loss if there is data in the column.
 
 */
-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'authenticated', 'restricted');
-- AlterTable
ALTER TABLE "AvailabilityShareLink" DROP COLUMN "visibility",
  ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'public';