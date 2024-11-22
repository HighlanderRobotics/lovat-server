/*
  Warnings:

  - The values [PICK_UP,DROP_RING,FEED_RING] on the enum `EventAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [BOTH] on the enum `PickUp` will be removed. If these variants are still used in the database, this will fail.
  - The values [AMP,SPEAKER,TRAP,WING_NEAR_AMP,WING_FRONT_OF_SPEAKER,WING_CENTER,WING_NEAR_SOURCE,GROUND_NOTE_ALLIANCE_NEAR_AMP,GROUND_NOTE_ALLIANCE_FRONT_OF_SPEAKER,GROUND_NOTE_ALLIANCE_BY_SPEAKER,GROUND_NOTE_CENTER_FARTHEST_AMP_SIDE,GROUND_NOTE_CENTER_TOWARD_AMP_SIDE,GROUND_NOTE_CENTER_CENTER,GROUND_NOTE_CENTER_TOWARD_SOURCE_SIDE,GROUND_NOTE_CENTER_FARTHEST_SOURCE_SIDE] on the enum `Position` will be removed. If these variants are still used in the database, this will fail.
  - The values [FEEDER] on the enum `RobotRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `highNote` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `stage` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `ampScores` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the column `feeds` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the column `speakerScores` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the column `stage` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the column `trapScores` on the `SharedPicklist` table. All the data in the column will be lost.
  - Added the required column `autoChargingResult` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endChargingResult` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AutoChargingResult" AS ENUM ('NOTHING', 'FAILED', 'TIPPED', 'ENGAGED');

-- CreateEnum
CREATE TYPE "StartingPiece" AS ENUM ('NOTHING', 'CUBE', 'CONE');

-- CreateEnum
CREATE TYPE "EndChargingResult" AS ENUM ('NOTHING', 'FAILED', 'TIPPED', 'ENGAGED');

-- AlterEnum
BEGIN;
CREATE TYPE "EventAction_new" AS ENUM ('LEAVE', 'PICK_UP_CONE', 'PICK_UP_CUBE', 'SCORE', 'DEFENSE', 'STARTING_POSITION');
ALTER TABLE "Event" ALTER COLUMN "action" TYPE "EventAction_new" USING ("action"::text::"EventAction_new");
ALTER TYPE "EventAction" RENAME TO "EventAction_old";
ALTER TYPE "EventAction_new" RENAME TO "EventAction";
DROP TYPE "EventAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PickUp_new" AS ENUM ('GROUND', 'CHUTE', 'SHELF');
ALTER TABLE "ScoutReport" ALTER COLUMN "pickUp" TYPE "PickUp_new" USING ("pickUp"::text::"PickUp_new");
ALTER TYPE "PickUp" RENAME TO "PickUp_old";
ALTER TYPE "PickUp_new" RENAME TO "PickUp";
DROP TYPE "PickUp_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Position_new" AS ENUM ('NONE', 'GRID_ONE_LOW', 'GRID_ONE_MID', 'GRID_ONE_HIGH', 'GRID_TWO_LOW', 'GRID_TWO_MID', 'GRID_TWO_HIGH', 'GRID_THREE_LOW', 'GRID_THREE_MID', 'GRID_THREE_HIGH', 'SCORE_HIGH', 'SCORE_MID', 'SCORE_LOW', 'AUTO_PIECE_ONE', 'AUTO_PIECE_TWO', 'AUTO_PIECE_THREE', 'AUTO_PIECE_FOUR', 'START_ONE', 'START_TWO', 'START_THREE');
ALTER TABLE "Event" ALTER COLUMN "position" TYPE "Position_new" USING ("position"::text::"Position_new");
ALTER TYPE "Position" RENAME TO "Position_old";
ALTER TYPE "Position_new" RENAME TO "Position";
DROP TYPE "Position_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RobotRole_new" AS ENUM ('OFFENSE', 'DEFENSE', 'IMMOBILE');
ALTER TABLE "ScoutReport" ALTER COLUMN "robotRole" TYPE "RobotRole_new" USING ("robotRole"::text::"RobotRole_new");
ALTER TYPE "RobotRole" RENAME TO "RobotRole_old";
ALTER TYPE "RobotRole_new" RENAME TO "RobotRole";
DROP TYPE "RobotRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "ScoutReport" DROP COLUMN "highNote",
DROP COLUMN "stage",
ADD COLUMN     "autoChargingResult" "AutoChargingResult" NOT NULL,
ADD COLUMN     "endChargingResult" "EndChargingResult" NOT NULL;

-- AlterTable
ALTER TABLE "SharedPicklist" DROP COLUMN "ampScores",
DROP COLUMN "feeds",
DROP COLUMN "speakerScores",
DROP COLUMN "stage",
DROP COLUMN "trapScores";

-- DropEnum
DROP TYPE "HighNoteResult";

-- DropEnum
DROP TYPE "StageResult";
