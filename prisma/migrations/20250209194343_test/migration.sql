-- CreateEnum
CREATE TYPE "Position" AS ENUM ('NONE', 'START_ONE', 'START_TWO', 'START_THREE', 'START_FOUR', 'LEVEL_ONE', 'LEVEL_TWO', 'LEVEL_THREE', 'LEVEL_FOUR', 'LEVEL_ONE_A', 'LEVEL_ONE_B', 'LEVEL_ONE_C', 'LEVEL_TWO_A', 'LEVEL_TWO_B', 'LEVEL_TWO_C', 'LEVEL_THREE_A', 'LEVEL_THREE_B', 'LEVEL_THREE_C', 'LEVEL_FOUR_A', 'LEVEL_FOUR_B', 'LEVEL_FOUR_C', 'GROUND_PIECE_A', 'GROUND_PIECE_B', 'GROUND_PIECE_C', 'CORAL_STATION_ONE', 'CORAL_STATION_TWO');

-- CreateEnum
CREATE TYPE "EventAction" AS ENUM ('PICKUP_CORAL', 'PICKUP_ALGAE', 'FEED', 'AUTO_LEAVE', 'DEFEND', 'SCORE_NET', 'FAIL_NET', 'SCORE_PROCESSOR', 'SCORE_CORAL', 'DROP_ALGAE', 'DROP_CORAL', 'START_POSITION');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('QUALIFICATION', 'ELIMINATION');

-- CreateEnum
CREATE TYPE "RobotRole" AS ENUM ('OFFENSE', 'DEFENSE', 'FEEDER', 'IMMOBILE');

-- CreateEnum
CREATE TYPE "AlgaePickup" AS ENUM ('NONE', 'GROUND', 'REEF', 'BOTH');

-- CreateEnum
CREATE TYPE "KnocksAlgae" AS ENUM ('NO', 'YES');

-- CreateEnum
CREATE TYPE "UnderShallowCage" AS ENUM ('NO', 'YES');

-- CreateEnum
CREATE TYPE "CoralPickup" AS ENUM ('NONE', 'GROUND', 'STATION', 'BOTH');

-- CreateEnum
CREATE TYPE "BargeResult" AS ENUM ('NOT_ATTEMPTED', 'PARKED', 'SHALLOW', 'FAILED_SHALLOW', 'DEEP', 'FAILED_DEEP');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ANALYST', 'SCOUTING_LEAD');

-- CreateTable
CREATE TABLE "Event" (
    "eventUuid" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "action" "EventAction" NOT NULL,
    "position" "Position" NOT NULL,
    "points" INTEGER NOT NULL,
    "scoutReportUuid" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("eventUuid")
);

-- CreateTable
CREATE TABLE "FeatureToggle" (
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FeatureToggle_pkey" PRIMARY KEY ("feature")
);

-- CreateTable
CREATE TABLE "TeamMatchData" (
    "key" TEXT NOT NULL,
    "tournamentKey" TEXT NOT NULL,
    "matchNumber" SMALLINT NOT NULL,
    "teamNumber" INTEGER NOT NULL,
    "matchType" "MatchType" NOT NULL,

    CONSTRAINT "TeamMatchData_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MutablePicklist" (
    "uuid" TEXT NOT NULL,
    "teams" INTEGER[],
    "authorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tournamentKey" TEXT,

    CONSTRAINT "MutablePicklist_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ScoutReport" (
    "uuid" TEXT NOT NULL,
    "teamMatchKey" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "robotRole" "RobotRole" NOT NULL,
    "algaePickup" "AlgaePickup" NOT NULL,
    "coralPickup" "CoralPickup" NOT NULL,
    "bargeResult" "BargeResult" NOT NULL,
    "knocksAlgae" "KnocksAlgae" NOT NULL,
    "underShallowCage" "UnderShallowCage" NOT NULL,
    "driverAbility" INTEGER NOT NULL,
    "scouterUuid" TEXT NOT NULL,

    CONSTRAINT "ScoutReport_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ScouterScheduleShift" (
    "uuid" TEXT NOT NULL,
    "sourceTeamNumber" INTEGER NOT NULL,
    "tournamentKey" TEXT NOT NULL,
    "startMatchOrdinalNumber" INTEGER NOT NULL,
    "endMatchOrdinalNumber" INTEGER NOT NULL,

    CONSTRAINT "ScouterScheduleShift_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Scouter" (
    "uuid" TEXT NOT NULL,
    "name" TEXT,
    "sourceTeamNumber" INTEGER NOT NULL,
    "strikes" INTEGER NOT NULL DEFAULT 0,
    "scouterReliability" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Scouter_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "SharedPicklist" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalPoints" DOUBLE PRECISION NOT NULL,
    "defense" DOUBLE PRECISION NOT NULL,
    "driverAbility" DOUBLE PRECISION NOT NULL,
    "autoPoints" DOUBLE PRECISION NOT NULL,
    "algaePickups" DOUBLE PRECISION NOT NULL,
    "coralPickups" DOUBLE PRECISION NOT NULL,
    "barge" DOUBLE PRECISION NOT NULL,
    "coralLevel1Scores" DOUBLE PRECISION NOT NULL,
    "coralLevel2Scores" DOUBLE PRECISION NOT NULL,
    "coralLevel3Scores" DOUBLE PRECISION NOT NULL,
    "coralLevel4Scores" DOUBLE PRECISION NOT NULL,
    "algaeProcessor" DOUBLE PRECISION NOT NULL,
    "algaeNet" DOUBLE PRECISION NOT NULL,
    "teleopPoints" DOUBLE PRECISION NOT NULL,
    "feeds" DOUBLE PRECISION NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "SharedPicklist_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Team" (
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "RegisteredTeam" (
    "number" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "teamApproved" BOOLEAN NOT NULL DEFAULT false,
    "website" TEXT,

    CONSTRAINT "RegisteredTeam_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "date" TEXT,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "teamNumber" INTEGER,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ANALYST',
    "tournamentSource" TEXT[],
    "teamSource" INTEGER[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "Event_scoutReportUuid_idx" ON "Event"("scoutReportUuid");

-- CreateIndex
CREATE INDEX "TeamMatchData_tournamentKey_teamNumber_idx" ON "TeamMatchData"("tournamentKey", "teamNumber");

-- CreateIndex
CREATE INDEX "Scouter_sourceTeamNumber_idx" ON "Scouter"("sourceTeamNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredTeam_code_key" ON "RegisteredTeam"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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
ALTER TABLE "Event" ADD CONSTRAINT "Event_scoutReportUuid_fkey" FOREIGN KEY ("scoutReportUuid") REFERENCES "ScoutReport"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMatchData" ADD CONSTRAINT "TeamMatchData_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutablePicklist" ADD CONSTRAINT "MutablePicklist_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutablePicklist" ADD CONSTRAINT "MutablePicklist_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutReport" ADD CONSTRAINT "ScoutReport_teamMatchKey_fkey" FOREIGN KEY ("teamMatchKey") REFERENCES "TeamMatchData"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutReport" ADD CONSTRAINT "ScoutReport_scouterUuid_fkey" FOREIGN KEY ("scouterUuid") REFERENCES "Scouter"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScouterScheduleShift" ADD CONSTRAINT "ScouterScheduleShift_sourceTeamNumber_fkey" FOREIGN KEY ("sourceTeamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScouterScheduleShift" ADD CONSTRAINT "ScouterScheduleShift_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scouter" ADD CONSTRAINT "Scouter_sourceTeamNumber_fkey" FOREIGN KEY ("sourceTeamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPicklist" ADD CONSTRAINT "SharedPicklist_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredTeam" ADD CONSTRAINT "RegisteredTeam_number_fkey" FOREIGN KEY ("number") REFERENCES "Team"("number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamNumber_fkey" FOREIGN KEY ("teamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE CASCADE ON UPDATE CASCADE;

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
