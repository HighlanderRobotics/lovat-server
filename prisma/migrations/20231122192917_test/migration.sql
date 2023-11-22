/*
  Warnings:

  - You are about to drop the column `sourceTeamNumber` on the `MutablePicklist` table. All the data in the column will be lost.
  - Changed the type of `position` on the `Event` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Position" AS ENUM ('NONE', 'PLACE_HOLDER');

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "position",
ADD COLUMN     "position" "Position" NOT NULL;

-- AlterTable
ALTER TABLE "MutablePicklist" DROP COLUMN "sourceTeamNumber";

-- AlterTable
ALTER TABLE "ScoutReport" ALTER COLUMN "startTime" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "RegisteredTeam" ADD CONSTRAINT "RegisteredTeam_number_fkey" FOREIGN KEY ("number") REFERENCES "Team"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
