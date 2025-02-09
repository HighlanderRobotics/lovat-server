/*
  Warnings:

  - The values [LEAVE,PICK_UP,DROP_RING,SCORE,DEFENSE,FEED_RING,STARTING_POSITION] on the enum `EventAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [AMP,SPEAKER,TRAP,WING_NEAR_AMP,WING_FRONT_OF_SPEAKER,WING_CENTER,WING_NEAR_SOURCE,GROUND_NOTE_ALLIANCE_NEAR_AMP,GROUND_NOTE_ALLIANCE_FRONT_OF_SPEAKER,GROUND_NOTE_ALLIANCE_BY_SPEAKER,GROUND_NOTE_CENTER_FARTHEST_AMP_SIDE,GROUND_NOTE_CENTER_TOWARD_AMP_SIDE,GROUND_NOTE_CENTER_CENTER,GROUND_NOTE_CENTER_TOWARD_SOURCE_SIDE,GROUND_NOTE_CENTER_FARTHEST_SOURCE_SIDE] on the enum `Position` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `highNote` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `pickUp` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `stage` on the `ScoutReport` table. All the data in the column will be lost.
  - Added the required column `algaePickup` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bargeResult` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coralPickup` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
DROP TABLE IF EXISTS "Event" CASCADE;
DROP TABLE IF EXISTS "ScoutReport" CASCADE;

CREATE TYPE "AlgaePickup" AS ENUM ('NONE', 'GROUND', 'REEF', 'BOTH');

-- CreateEnum
CREATE TYPE "CoralPickup" AS ENUM ('NONE', 'GROUND', 'STATION', 'BOTH');

-- CreateEnum
CREATE TYPE "BargeResult" AS ENUM ('NOT_ATTEMPTED', 'PARKED', 'SHALLOW', 'FAILED_SHALLOW', 'DEEP', 'FAILED_DEEP');

-- AlterEnum
BEGIN;
CREATE TYPE "EventAction_new" AS ENUM ('PICKUP_CORAL', 'PICKUP_ALGAE', 'FEED', 'AUTO_LEAVE', 'DEFEND', 'SCORE_NET', 'FAIL_NET', 'SCORE_PROCESSOR', 'SCORE_CORAL', 'DROP_ALGAE', 'DROP_CORAL', 'START_POSITION');
ALTER TABLE "Event" ALTER COLUMN "action" TYPE "EventAction_new" USING ("action"::text::"EventAction_new");
ALTER TYPE "EventAction" RENAME TO "EventAction_old";
ALTER TYPE "EventAction_new" RENAME TO "EventAction";
DROP TYPE "EventAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Position_new" AS ENUM ('NONE', 'START_ONE', 'START_TWO', 'START_THREE', 'START_FOUR', 'LEVEL_ONE', 'LEVEL_TWO', 'LEVEL_THREE', 'LEVEL_FOUR', 'LEVEL_ONE_A', 'LEVEL_ONE_B', 'LEVEL_ONE_C', 'LEVEL_TWO_A', 'LEVEL_TWO_B', 'LEVEL_TWO_C', 'LEVEL_THREE_A', 'LEVEL_THREE_B', 'LEVEL_THREE_C', 'LEVEL_FOUR_A', 'LEVEL_FOUR_B', 'LEVEL_FOUR_C', 'GROUND_PIECE_A', 'GROUND_PIECE_B', 'GROUND_PIECE_C', 'CORAL_STATION_ONE', 'CORAL_STATION_TWO');
ALTER TABLE "Event" ALTER COLUMN "position" TYPE "Position_new" USING ("position"::text::"Position_new");
ALTER TYPE "Position" RENAME TO "Position_old";
ALTER TYPE "Position_new" RENAME TO "Position";
DROP TYPE "Position_old";
COMMIT;

-- AlterTable
ALTER TABLE "ScoutReport" DROP COLUMN "highNote",
DROP COLUMN "pickUp",
DROP COLUMN "stage",
ADD COLUMN     "algaePickup" "AlgaePickup" NOT NULL,
ADD COLUMN     "bargeResult" "BargeResult" NOT NULL,
ADD COLUMN     "coralPickup" "CoralPickup" NOT NULL;

-- DropEnum
DROP TYPE "HighNoteResult";

-- DropEnum
DROP TYPE "PickUp";

-- DropEnum
DROP TYPE "StageResult";
