-- DropForeignKey
ALTER TABLE "RegisteredTeam" DROP CONSTRAINT "RegisteredTeam_number_fkey";

-- DropForeignKey
ALTER TABLE "ScoutReport" DROP CONSTRAINT "ScoutReport_teamMatchKey_fkey";

-- DropForeignKey
ALTER TABLE "Scouter" DROP CONSTRAINT "Scouter_sourceTeamNumber_fkey";

-- DropForeignKey
ALTER TABLE "ScouterScheduleShift" DROP CONSTRAINT "ScouterScheduleShift_sourceTeamNumber_fkey";

-- DropForeignKey
ALTER TABLE "ScouterScheduleShift" DROP CONSTRAINT "ScouterScheduleShift_tournamentKey_fkey";

-- DropForeignKey
ALTER TABLE "TeamMatchData" DROP CONSTRAINT "TeamMatchData_tournamentKey_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_teamNumber_fkey";

-- AddForeignKey
ALTER TABLE "TeamMatchData" ADD CONSTRAINT "TeamMatchData_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutReport" ADD CONSTRAINT "ScoutReport_teamMatchKey_fkey" FOREIGN KEY ("teamMatchKey") REFERENCES "TeamMatchData"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScouterScheduleShift" ADD CONSTRAINT "ScouterScheduleShift_sourceTeamNumber_fkey" FOREIGN KEY ("sourceTeamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScouterScheduleShift" ADD CONSTRAINT "ScouterScheduleShift_tournamentKey_fkey" FOREIGN KEY ("tournamentKey") REFERENCES "Tournament"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scouter" ADD CONSTRAINT "Scouter_sourceTeamNumber_fkey" FOREIGN KEY ("sourceTeamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisteredTeam" ADD CONSTRAINT "RegisteredTeam_number_fkey" FOREIGN KEY ("number") REFERENCES "Team"("number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamNumber_fkey" FOREIGN KEY ("teamNumber") REFERENCES "RegisteredTeam"("number") ON DELETE CASCADE ON UPDATE CASCADE;
