/*
  Warnings:

  - The values [TRUE,FALSE] on the enum `KnocksAlgae` will be removed. If these variants are still used in the database, this will fail.
  - The values [TRUE,FALSE] on the enum `UnderShallowCage` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `KnocksAlgae` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `UnderShallowCage` on the `ScoutReport` table. All the data in the column will be lost.
  - You are about to drop the column `climb` on the `SharedPicklist` table. All the data in the column will be lost.
  - Added the required column `knocksAlgae` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `underShallowCage` to the `ScoutReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `algaePickups` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `barge` to the `SharedPicklist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "KnocksAlgae_new" AS ENUM ('YES', 'NO');
ALTER TABLE "ScoutReport" ALTER COLUMN "knocksAlgae" TYPE "KnocksAlgae_new" USING ("knocksAlgae"::text::"KnocksAlgae_new");
ALTER TYPE "KnocksAlgae" RENAME TO "KnocksAlgae_old";
ALTER TYPE "KnocksAlgae_new" RENAME TO "KnocksAlgae";
DROP TYPE "KnocksAlgae_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UnderShallowCage_new" AS ENUM ('YES', 'NO');
ALTER TABLE "ScoutReport" ALTER COLUMN "underShallowCage" TYPE "UnderShallowCage_new" USING ("underShallowCage"::text::"UnderShallowCage_new");
ALTER TYPE "UnderShallowCage" RENAME TO "UnderShallowCage_old";
ALTER TYPE "UnderShallowCage_new" RENAME TO "UnderShallowCage";
DROP TYPE "UnderShallowCage_old";
COMMIT;

-- AlterTable
ALTER TABLE "ScoutReport" DROP COLUMN "KnocksAlgae",
DROP COLUMN "UnderShallowCage",
ADD COLUMN     "knocksAlgae" "KnocksAlgae" NOT NULL,
ADD COLUMN     "underShallowCage" "UnderShallowCage" NOT NULL;

-- AlterTable
ALTER TABLE "SharedPicklist" DROP COLUMN "climb",
ADD COLUMN     "algaePickups" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "barge" DOUBLE PRECISION NOT NULL;
