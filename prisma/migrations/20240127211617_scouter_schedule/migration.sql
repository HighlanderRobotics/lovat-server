/*
  Warnings:

  - You are about to drop the column `team1` on the `ScouterScheduleShift` table. All the data in the column will be lost.
  - You are about to drop the column `team2` on the `ScouterScheduleShift` table. All the data in the column will be lost.
  - You are about to drop the column `team3` on the `ScouterScheduleShift` table. All the data in the column will be lost.
  - You are about to drop the column `team4` on the `ScouterScheduleShift` table. All the data in the column will be lost.
  - You are about to drop the column `team5` on the `ScouterScheduleShift` table. All the data in the column will be lost.
  - You are about to drop the column `team6` on the `ScouterScheduleShift` table. All the data in the column will be lost.
  - You are about to alter the column `ampScores` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `autoPoints` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `defense` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `driverAbility` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `feeds` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `pickUps` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `speakerScores` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `stage` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `teleopPoints` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `totalPoints` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `trapScores` on the `SharedPicklist` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "ScouterScheduleShift" DROP COLUMN "team1",
DROP COLUMN "team2",
DROP COLUMN "team3",
DROP COLUMN "team4",
DROP COLUMN "team5",
DROP COLUMN "team6";

-- AlterTable
ALTER TABLE "SharedPicklist" ALTER COLUMN "ampScores" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "autoPoints" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "defense" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "driverAbility" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "feeds" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "pickUps" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "speakerScores" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "stage" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "teleopPoints" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "totalPoints" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "trapScores" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "_Team1" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Team2" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Team3" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Team4" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Team5" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Team6" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Team1_AB_unique" ON "_Team1"("A", "B");

-- CreateIndex
CREATE INDEX "_Team1_B_index" ON "_Team1"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Team2_AB_unique" ON "_Team2"("A", "B");

-- CreateIndex
CREATE INDEX "_Team2_B_index" ON "_Team2"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Team3_AB_unique" ON "_Team3"("A", "B");

-- CreateIndex
CREATE INDEX "_Team3_B_index" ON "_Team3"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Team4_AB_unique" ON "_Team4"("A", "B");

-- CreateIndex
CREATE INDEX "_Team4_B_index" ON "_Team4"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Team5_AB_unique" ON "_Team5"("A", "B");

-- CreateIndex
CREATE INDEX "_Team5_B_index" ON "_Team5"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Team6_AB_unique" ON "_Team6"("A", "B");

-- CreateIndex
CREATE INDEX "_Team6_B_index" ON "_Team6"("B");

-- AddForeignKey
ALTER TABLE "_Team1" ADD CONSTRAINT "_Team1_A_fkey" FOREIGN KEY ("A") REFERENCES "Scouter"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team1" ADD CONSTRAINT "_Team1_B_fkey" FOREIGN KEY ("B") REFERENCES "ScouterScheduleShift"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team2" ADD CONSTRAINT "_Team2_A_fkey" FOREIGN KEY ("A") REFERENCES "Scouter"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team2" ADD CONSTRAINT "_Team2_B_fkey" FOREIGN KEY ("B") REFERENCES "ScouterScheduleShift"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team3" ADD CONSTRAINT "_Team3_A_fkey" FOREIGN KEY ("A") REFERENCES "Scouter"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team3" ADD CONSTRAINT "_Team3_B_fkey" FOREIGN KEY ("B") REFERENCES "ScouterScheduleShift"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team4" ADD CONSTRAINT "_Team4_A_fkey" FOREIGN KEY ("A") REFERENCES "Scouter"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team4" ADD CONSTRAINT "_Team4_B_fkey" FOREIGN KEY ("B") REFERENCES "ScouterScheduleShift"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team5" ADD CONSTRAINT "_Team5_A_fkey" FOREIGN KEY ("A") REFERENCES "Scouter"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team5" ADD CONSTRAINT "_Team5_B_fkey" FOREIGN KEY ("B") REFERENCES "ScouterScheduleShift"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team6" ADD CONSTRAINT "_Team6_A_fkey" FOREIGN KEY ("A") REFERENCES "Scouter"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Team6" ADD CONSTRAINT "_Team6_B_fkey" FOREIGN KEY ("B") REFERENCES "ScouterScheduleShift"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
