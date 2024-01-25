/*
  Warnings:

  - The values [PICK_UP_CONE,PICK_UP_CUBE,PLACE_OBJECT] on the enum `EventAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [PLACE_HOLDER] on the enum `Position` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `autoChallengeResult` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `challengeResult` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `links` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `penaltyCard` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `avgTotal` on the `SharedPicklist` table. All the data in the column will be lost.
  - Added the required column `highNote` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickUp` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stage` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `startTime` on the `ScoutReport` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `ampScores` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoPoints` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defense` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverAbility` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feeds` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickUps` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `speakerScores` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stage` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teleopPoints` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPoints` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trapScores` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HighNoteResult" AS ENUM ('NOT_ATTEMPTED', 'FAILED', 'SUCCESSFUL');

-- CreateEnum
CREATE TYPE "StageResult" AS ENUM ('NOTHING', 'PARK', 'ONSTAGE', 'ONSTAGE_HARMONY');

-- CreateEnum
CREATE TYPE "PickUp" AS ENUM ('GROUND', 'CHUTE', 'BOTH');

-- AlterEnum
BEGIN;
CREATE TYPE "EventAction_new" AS ENUM ('LEAVE', 'PICK_UP', 'DROP_RING', 'SCORE', 'DEFENSE', 'FEED_RING', 'STARTING_POSITION');
ALTER TABLE "Event" ALTER COLUMN "action" TYPE "EventAction_new" USING ("action"::text::"EventAction_new");
ALTER TYPE "EventAction" RENAME TO "EventAction_old";
ALTER TYPE "EventAction_new" RENAME TO "EventAction";
DROP TYPE "EventAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Position_new" AS ENUM ('NONE', 'AMP', 'SPEAKER', 'TRAP', 'WING_NEAR_AMP', 'WING_FRONT_OF_SPEAKER', 'WING_CENTER', 'WING_NEAR_SOURCE', 'GROUND_NOTE_ALLIANCE_NEAR_AMP', 'GROUND_NOTE_ALLIANCE_FRONT_OF_SPEAKER', 'GROUND_NOTE_ALLIANCE_BY_SPEAKER', 'GROUND_NOTE_CENTER_FARTHEST_AMP_SIDE', 'GROUND_NOTE_CENTER_TOWARD_AMP_SIDE', 'GROUND_NOTE_CENTER_CENTER', 'GROUND_NOTE_CENTER_TOWARD_SOURCE_SIDE', 'GROUND_NOTE_CENTER_FARTHEST_SOURCE_SIDE');
ALTER TABLE "Event" ALTER COLUMN "position" TYPE "Position_new" USING ("position"::text::"Position_new");
ALTER TYPE "Position" RENAME TO "Position_old";
ALTER TYPE "Position_new" RENAME TO "Position";
DROP TYPE "Position_old";
COMMIT;

-- AlterTable
ALTER TABLE "MutablePicklist" ADD COLUMN     "tournamentKey" TEXT;

-- AlterTable
ALTER TABLE "ScoutReport" DROP COLUMN "autoChallengeResult",
DROP COLUMN "challengeResult",
DROP COLUMN "links",
DROP COLUMN "penaltyCard",
ADD COLUMN     "highNote" "HighNoteResult" NOT NULL,
ADD COLUMN     "pickUp" "PickUp" NOT NULL,
ADD COLUMN     "stage" "StageResult" NOT NULL,
DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SharedPicklist" DROP COLUMN "avgTotal",
ADD COLUMN     "ampScores" INTEGER NOT NULL,
ADD COLUMN     "autoPoints" INTEGER NOT NULL,
ADD COLUMN     "defense" INTEGER NOT NULL,
ADD COLUMN     "driverAbility" INTEGER NOT NULL,
ADD COLUMN     "feeds" INTEGER NOT NULL,
ADD COLUMN     "pickUps" INTEGER NOT NULL,
ADD COLUMN     "speakerScores" INTEGER NOT NULL,
ADD COLUMN     "stage" INTEGER NOT NULL,
ADD COLUMN     "teleopPoints" INTEGER NOT NULL,
ADD COLUMN     "totalPoints" SMALLINT NOT NULL,
ADD COLUMN     "trapScores" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "AutoChallengeResult";

-- DropEnum
DROP TYPE "PenaltyCard";

-- DropEnum
DROP TYPE "TeleopChallengeResult";

-- AddForeignKey
ALTER TABLE "MutablePicklist" ADD CONSTRAINT "MutablePicklist_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE SET NULL ON UPDATE CASCADE;
