/*
  Warnings:

  - You are about to drop the column `ampScores` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the column `pickUps` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the column `speakerScores` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the column `stage` on the `SharedPicklist` table. All the data in the column will be lost.
  - You are about to drop the column `trapScores` on the `SharedPicklist` table. All the data in the column will be lost.
  - Added the required column `KnocksAlgae` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UnderShallowCage` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `algaeNet` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `algaeProcessor` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `climb` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coralLevel1Scores` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coralLevel2Scores` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coralLevel3Scores` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coralLevel4Scores` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coralPickups` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KnocksAlgae" AS ENUM ('TRUE', 'FALSE');

-- CreateEnum
CREATE TYPE "UnderShallowCage" AS ENUM ('TRUE', 'FALSE');

-- AlterTable
ALTER TABLE "ScoutReport" ADD COLUMN     "KnocksAlgae" "KnocksAlgae" NOT NULL,
ADD COLUMN     "UnderShallowCage" "UnderShallowCage" NOT NULL;

-- AlterTable
ALTER TABLE "SharedPicklist" DROP COLUMN "ampScores",
DROP COLUMN "pickUps",
DROP COLUMN "speakerScores",
DROP COLUMN "stage",
DROP COLUMN "trapScores",
ADD COLUMN     "algaeNet" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "algaeProcessor" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "climb" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coralLevel1Scores" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coralLevel2Scores" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coralLevel3Scores" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coralLevel4Scores" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coralPickups" DOUBLE PRECISION NOT NULL;
