-- DropForeignKey
ALTER TABLE "ScoutReport" DROP CONSTRAINT "ScoutReport_scouterUuid_fkey";

-- AddForeignKey
ALTER TABLE "ScoutReport" ADD CONSTRAINT "ScoutReport_scouterUuid_fkey" FOREIGN KEY ("scouterUuid") REFERENCES "Scouter"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
