-- AlterTable
ALTER TABLE "Event" DROP COLUMN "points",
ADD COLUMN     "quantity" INTEGER,
ALTER COLUMN "time" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ScoutReport" DROP COLUMN "robotRole",
ADD COLUMN     "robotRoles" "RobotRole"[];
