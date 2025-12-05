import prismaClient from "../../../prismaClient";
import z from "zod";
import {
  Metric,
  FlippedRoleMap,
  specificMatchPageMetrics,
  metricToName,
} from "../analysisConstants";
import { BargeResultReverseMap } from "../../manager/managerConstants";
import { autoPathScouter } from "./autoPathScouter.js";
import { averageScoutReport } from "../coreAnalysis/averageScoutReport";
import { createAnalysisHandler } from "../analysisHandler";

export const matchPageSpecificScouter = createAnalysisHandler({
  params: {
    params: z.object({
      uuid: z.string(),
    }),
  },
  usesDataSource: false,
  shouldCache: false,
  createKey: ({ params }) => {
    return {
      key: ["matchPageSpecificScouter", params.uuid],
      teamDependencies: [],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    const scoutReport = await prismaClient.scoutReport.findUnique({
      where: {
        uuid: params.uuid,
      },
    });

    const output = {
      totalPoints: (
        await averageScoutReport(ctx.user, {
          scoutReportUuid: scoutReport.uuid,
          metrics: [Metric.totalPoints],
        })
      )[Metric.totalPoints],
      driverAbility: scoutReport.driverAbility,
      role: FlippedRoleMap[scoutReport.robotRole],
      // stage : stageMap[scoutReport.stage],
      // highNote : highNoteMap[scoutReport.highNote],
      barge: BargeResultReverseMap[scoutReport.bargeResult],
      autoPath: await autoPathScouter(ctx.user, {
        matchKey: scoutReport.teamMatchKey,
        scoutReportUuid: scoutReport.uuid,
      }),
      note: scoutReport.notes,
      robotBrokeDescription: scoutReport.robotBrokeDescription,
      timeStamp: scoutReport.startTime,
    };

    const aggregateData = await averageScoutReport(ctx.user, {
      scoutReportUuid: scoutReport.uuid,
      metrics: specificMatchPageMetrics,
    });

    for (const metric of specificMatchPageMetrics) {
      output[metricToName[metric]] = aggregateData[metric];
    }

    return output;
  },
});
