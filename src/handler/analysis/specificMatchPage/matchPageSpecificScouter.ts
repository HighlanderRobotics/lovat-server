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
import { getAnswersForReport } from "../customFields/customFieldShared.js";
import { UserRole } from "@prisma/client";

export const matchPageSpecificScouter = createAnalysisHandler({
  params: {
    params: z.object({
      uuid: z.string(),
    }),
  },
  usesDataSource: false,
  shouldCache: false,
  createKey: async ({ params }) => {
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
        accuracy: true,
        scouter: {
          select: {
            sourceTeamNumber: true,
          },
        },
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
      Metric.volleysPerMatch,
      Metric.totalBallsFed,
    ];

    const agg = await averageScoutReport(ctx.user, {
      scoutReportUuid: scoutReport.uuid,
      metrics,
    });

    const rawAutoClimbStartTime = agg[Metric.autoClimbStartTime];

    const output: any = {
      totalPoints: agg[Metric.totalPoints],
      driverAbility: scoutReport.driverAbility,
      accuracy: scoutReport.accuracy,
      totalBallsFed: agg[Metric.totalBallsFed],
      volleys: agg[Metric.volleysPerMatch],
      defenseEffectiveness: scoutReport.defenseEffectiveness,
      robotRoles: scoutReport.robotRoles.map((role) => FlippedRoleMap[role]),
      climb: EndgameClimbReverseMap[scoutReport.endgameClimb],
      autoClimb: AutoClimbReverseMap[scoutReport.autoClimb],
      autoClimbStartTime:
        rawAutoClimbStartTime !== null && rawAutoClimbStartTime !== undefined
          ? 2 * 60 + 33 - rawAutoClimbStartTime
          : 0,
      contactDefenseTime: agg[Metric.contactDefenseTime] ?? 0,
      campingDefenseTime: agg[Metric.campingDefenseTime] ?? 0,
      totalDefenseTime: agg[Metric.totalDefenseTime] ?? 0,
      scoringRate: agg[Metric.fuelPerSecond] ?? 0,
      feedingRate: agg[Metric.feedingRate] ?? 0,
      feeds: agg[Metric.feedsPerMatch] ?? 0,
      feederType: (scoutReport.feederTypes || []).map(
        (f) => FeederTypeReverseMap[f],
      ),
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

    // Custom field answers are shown inline with their question names, so they
    // read correctly for any viewer who can already see this report — not just
    // the report's own team. (Aggregate surfaces like categories/breakdowns
    // stay own-team-scoped because mixing teams' fields there is meaningless.)
    // Handler is shouldCache: false, so computing per-request is fine.
    output.customFieldAnswers = await getAnswersForReport(scoutReport.uuid);

    // Scouting leads of the report's own team may edit its text custom answers.
    output.canModify =
      ctx.user.teamNumber !== null &&
      ctx.user.role === UserRole.SCOUTING_LEAD &&
      scoutReport.scouter?.sourceTeamNumber === ctx.user.teamNumber;

    // The custom questions belong to the team whose scout answered them, which
    // may not be the viewer's team (data sharing). The client labels the
    // section accordingly.
    output.customFieldsSourceTeam =
      scoutReport.scouter?.sourceTeamNumber ?? null;
    output.customFieldsAreOwnTeam =
      ctx.user.teamNumber !== null &&
      scoutReport.scouter?.sourceTeamNumber === ctx.user.teamNumber;

    return output;
  },
});
