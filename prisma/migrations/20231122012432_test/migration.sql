/*
  Warnings:

  - You are about to drop the column `username` on the `MutablePicklist` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `RegisteredTeam` table. All the data in the column will be lost.
  - You are about to drop the column `registeredTeamTeam` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `teamNumber` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `tournamentTournamentKey` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `sourceTeamNumber` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `authorId` to the `MutablePicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `website` to the `RegisteredTeam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MutablePicklist" DROP CONSTRAINT "MutablePicklist_sourceTeamNumber_fkey";

-- DropForeignKey
ALTER TABLE "ScoutReport" DROP CONSTRAINT "ScoutReport_registeredTeamTeam_fkey";

-- DropForeignKey
ALTER TABLE "ScoutReport" DROP CONSTRAINT "ScoutReport_teamNumber_fkey";

-- DropForeignKey
ALTER TABLE "ScoutReport" DROP CONSTRAINT "ScoutReport_tournamentTournamentKey_fkey";

-- DropForeignKey
ALTER TABLE "ScouterScheduleShift" DROP CONSTRAINT "ScouterScheduleShift_sourceTeamNumber_fkey";

-- DropForeignKey
ALTER TABLE "SharedPicklist" DROP CONSTRAINT "SharedPicklist_sourceTeamNumber_fkey";

-- AlterTable
ALTER TABLE "MutablePicklist" DROP COLUMN "username",
ADD COLUMN     "authorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RegisteredTeam" DROP COLUMN "username",
ADD COLUMN     "website" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScoutReport" DROP COLUMN "registeredTeamTeam",
DROP COLUMN "teamNumber",
DROP COLUMN "tournamentTournamentKey";

-- AlterTable
ALTER TABLE "ScouterScheduleShift" ALTER COLUMN "sourceTeamNumber" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "SharedPicklist" DROP COLUMN "sourceTeamNumber",
DROP COLUMN "username",
ADD COLUMN     "authorId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Users";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "teamNumber" INTEGER,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "MutablePicklist" ADD CONSTRAINT "MutablePicklist_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScouterScheduleShift" ADD CONSTRAINT "ScouterScheduleShift_sourceTeamNumber_fkey" FOREIGN KEY ("sourceTeamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPicklist" ADD CONSTRAINT "SharedPicklist_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamNumber_fkey" FOREIGN KEY ("teamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE SET NULL ON UPDATE CASCADE;
