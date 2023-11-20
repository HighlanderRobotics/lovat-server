-- CreateEnum
CREATE TYPE "EventAction" AS ENUM ('PICK_UP_CONE', 'PICK_UP_CUBE', 'PLACE_OBJECT');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('QUALIFICATION', 'ELIMINATION');

-- CreateEnum
CREATE TYPE "RobotRole" AS ENUM ('OFFENSE', 'DEFENSE', 'FEEDER', 'IMMOBILE');

-- CreateEnum
CREATE TYPE "AutoChallengeResult" AS ENUM ('NONE', 'DOCKED', 'ENGAGED', 'FAILED', 'MOBILITY');

-- CreateEnum
CREATE TYPE "TeleopChallengeResult" AS ENUM ('NONE', 'DOCKED', 'ENGAGED', 'FAILED', 'IN_COMMUNITY');

-- CreateEnum
CREATE TYPE "PenaltyCard" AS ENUM ('NONE', 'YELLOW', 'RED');

-- CreateTable
CREATE TABLE "Event" (
    "eventUuid" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "action" "EventAction" NOT NULL,
    "position" INTEGER NOT NULL,
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
CREATE TABLE "FlaggedScoutReport" (
    "uuid" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "scoutReportUuid" TEXT NOT NULL,

    CONSTRAINT "FlaggedScoutReport_pkey" PRIMARY KEY ("uuid")
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
    "sourceTeamNumber" INTEGER NOT NULL,
    "username" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "MutablePicklist_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ScoutReport" (
    "uuid" TEXT NOT NULL,
    "teamMatchKey" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "links" INTEGER NOT NULL,
    "robotRole" "RobotRole" NOT NULL,
    "autoChallengeResult" "AutoChallengeResult" NOT NULL,
    "challengeResult" "TeleopChallengeResult" NOT NULL,
    "penaltyCard" "PenaltyCard" NOT NULL,
    "driverAbility" INTEGER NOT NULL,
    "teamNumber" INTEGER NOT NULL,
    "scouterUuid" TEXT NOT NULL,
    "registeredTeamTeam" SMALLINT,
    "tournamentTournamentKey" TEXT,

    CONSTRAINT "ScoutReport_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ScouterScheduleShift" (
    "uuid" TEXT NOT NULL,
    "sourceTeamNumber" SMALLINT NOT NULL,
    "tournamentKey" TEXT NOT NULL,
    "startMatchOrdinalNumber" INTEGER NOT NULL,
    "endMatchOrdinalNumber" INTEGER NOT NULL,
    "team1" INTEGER[],
    "team2" INTEGER[],
    "team3" INTEGER[],
    "team4" INTEGER[],
    "team5" INTEGER[],
    "team6" INTEGER[],

    CONSTRAINT "ScouterScheduleShift_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Scouter" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceTeamNumber" INTEGER NOT NULL,
    "strikes" INTEGER NOT NULL DEFAULT 0,
    "scouterReliability" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Scouter_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "SharedPicklist" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avgTotal" SMALLINT NOT NULL,
    "sourceTeamNumber" INTEGER NOT NULL,
    "username" TEXT,

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
    "code" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "teamApproved" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,

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
CREATE TABLE "Users" (
    "team" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "FlaggedScoutReport_scoutReportUuid_key" ON "FlaggedScoutReport"("scoutReportUuid");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredTeam_code_key" ON "RegisteredTeam"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email2_key" ON "Users"("email");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_scoutReportUuid_fkey" FOREIGN KEY ("scoutReportUuid") REFERENCES "ScoutReport"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlaggedScoutReport" ADD CONSTRAINT "FlaggedScoutReport_scoutReportUuid_fkey" FOREIGN KEY ("scoutReportUuid") REFERENCES "ScoutReport"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMatchData" ADD CONSTRAINT "TeamMatchData_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutablePicklist" ADD CONSTRAINT "MutablePicklist_sourceTeamNumber_fkey" FOREIGN KEY ("sourceTeamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutReport" ADD CONSTRAINT "ScoutReport_teamMatchKey_fkey" FOREIGN KEY ("teamMatchKey") REFERENCES "TeamMatchData"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutReport" ADD CONSTRAINT "ScoutReport_teamNumber_fkey" FOREIGN KEY ("teamNumber") REFERENCES "Team"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutReport" ADD CONSTRAINT "ScoutReport_scouterUuid_fkey" FOREIGN KEY ("scouterUuid") REFERENCES "Scouter"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutReport" ADD CONSTRAINT "ScoutReport_registeredTeamTeam_fkey" FOREIGN KEY ("registeredTeamTeam") REFERENCES "RegisteredTeam"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutReport" ADD CONSTRAINT "ScoutReport_tournamentTournamentKey_fkey" FOREIGN KEY ("tournamentTournamentKey") REFERENCES "Tournament"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScouterScheduleShift" ADD CONSTRAINT "ScouterScheduleShift_sourceTeamNumber_fkey" FOREIGN KEY ("sourceTeamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScouterScheduleShift" ADD CONSTRAINT "ScouterScheduleShift_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scouter" ADD CONSTRAINT "Scouter_sourceTeamNumber_fkey" FOREIGN KEY ("sourceTeamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedPicklist" ADD CONSTRAINT "SharedPicklist_sourceTeamNumber_fkey" FOREIGN KEY ("sourceTeamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
