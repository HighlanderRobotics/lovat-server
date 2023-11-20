/*
  Warnings:

  - Added the required column `role` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ANALYST', 'SCOUTING_LEAD');

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "role" "UserRole" NOT NULL;
