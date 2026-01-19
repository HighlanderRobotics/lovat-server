import prismaClient from "../../../prismaClient.js";
import z from "zod";
import {
  Metric,
  FlippedRoleMap,
  specificMatchPageMetrics,
  metricToName,
} from "../analysisConstants.js";
import {
  AutoClimbReverseMap,
  EndgameClimbReverseMap,
  FeederTypeReverseMap,
} from "../../manager/managerConstants.js";
import { autoPathScouter } from "./autoPathScouter.js";
import { averageScoutReport } from "../coreAnalysis/averageScoutReport.js";
import { createAnalysisHandler } from "../analysisHandler.js";

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
      select: {
        uuid: true,
        teamMatchKey: true,
        startTime: true,
        notes: true,
        robotBrokeDescription: true,
        driverAbility: true,
        defenseEffectiveness: true,
        robotRoles: true,
        endgameClimb: true,
        autoClimb: true,
        feederTypes: true,
      },
    });

    if (!scoutReport) return {} as any;

    const metrics = [
      Metric.totalPoints,
      Metric.autoClimbStartTime,
      Metric.contactDefenseTime,
      Metric.campingDefenseTime,
      Metric.totalDefenseTime,
      Metric.fuelPerSecond,
      Metric.feedingRate,
      Metric.feedsPerMatch,
      Metric.l1StartTime,
    ];

    const agg = await averageScoutReport(ctx.user, {
      scoutReportUuid: scoutReport.uuid,
      metrics,
    });

    const output: any = {
      totalPoints: agg[Metric.totalPoints],
      driverAbility: scoutReport.driverAbility,
      defenseEffectiveness: scoutReport.defenseEffectiveness,
      robotRoles: scoutReport.robotRoles.map((role) => FlippedRoleMap[role]),
      climb: EndgameClimbReverseMap[scoutReport.endgameClimb],
      autoClimb: AutoClimbReverseMap[scoutReport.autoClimb],
      autoClimbStartTime: agg[Metric.autoClimbStartTime] ?? 0,
      contactDefenseTime: agg[Metric.contactDefenseTime] ?? 0,
      campingDefenseTime: agg[Metric.campingDefenseTime] ?? 0,
      totalDefenseTime: agg[Metric.totalDefenseTime] ?? 0,
      scoringRate: agg[Metric.fuelPerSecond] ?? 0,
      feedingRate: agg[Metric.feedingRate] ?? 0,
      feeds: agg[Metric.feedsPerMatch] ?? 0,
      feederType: (scoutReport.feederTypes || []).map((f) => FeederTypeReverseMap[f]),
      climbResult: EndgameClimbReverseMap[scoutReport.endgameClimb],
      climbStartTime: agg[Metric.l1StartTime] ?? 0,
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
