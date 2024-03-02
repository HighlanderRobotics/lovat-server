-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_scoutReportUuid_fkey";

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_scoutReportUuid_fkey" FOREIGN KEY ("scoutReportUuid") REFERENCES "ScoutReport"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
