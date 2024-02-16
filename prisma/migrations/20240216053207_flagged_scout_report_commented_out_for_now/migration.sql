/*
  Warnings:

  - You are about to drop the `FlaggedScoutReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FlaggedScoutReport" DROP CONSTRAINT "FlaggedScoutReport_scoutReportUuid_fkey";

-- DropTable
DROP TABLE "FlaggedScoutReport";
