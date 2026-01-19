import prismaClient from "../../../prismaClient.js";
import z from "zod";
import {
  Metric,
  FlippedRoleMap,
  specificMatchPageMetrics,
  metricToName,
  autoEnd,
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
      include: {
        events: {
          select: { action: true, position: true, points: true, time: true },
        },
      },
    });

    if (!scoutReport) return {} as any;

    const events = scoutReport.events ?? [];

    const firstEventTime = (
      action: string,
      predicate?: (t: number) => boolean,
    ) => {
      const evt = events
        .filter(
          (e) => e.action === action && (predicate ? predicate(e.time) : true),
        )
        .sort((a, b) => a.time - b.time)[0];
      return evt ? evt.time : 0;
    };

    const pairedDuration = (startAction: string, stopAction: string) => {
      const relevant = events
        .filter((e) => e.action === startAction || e.action === stopAction)
        .sort((a, b) => a.time - b.time);
      let total = 0;
      for (let i = 0; i < relevant.length; i += 2) {
        const start = relevant[i];
        const stop = relevant[i + 1];
        if (
          start &&
          stop &&
          start.action === startAction &&
          stop.action === stopAction
        ) {
          total += stop.time - start.time;
        }
      }
      return total;
    };

    const totalScoringPoints = events
      .filter((e) => e.action === "STOP_SCORING")
      .reduce((acc, cur) => acc + cur.points, 0);
    const firstStopScoringTime = events
      .filter((e) => e.action === "STOP_SCORING")
      .sort((a, b) => a.time - b.time)[0]?.time;
    const scoringDuration = firstStopScoringTime
      ? firstStopScoringTime - (events[0]?.time ?? 0)
      : 150;
    const scoringRate =
      scoringDuration > 0 ? totalScoringPoints / scoringDuration : 0;

    const totalFeedPoints = events
      .filter((e) => e.action === "STOP_FEEDING")
      .reduce((acc, cur) => acc + cur.points, 0);
    const totalFeedingTime = pairedDuration("START_FEEDING", "STOP_FEEDING");
    const feedingRate =
      totalFeedingTime > 0 ? totalFeedPoints / totalFeedingTime : 0;

    const output: any = {
      totalPoints: (
        await averageScoutReport(ctx.user, {
          scoutReportUuid: scoutReport.uuid,
          metrics: [Metric.totalPoints],
        })
      )[Metric.totalPoints],
      driverAbility: scoutReport.driverAbility,
      defenseEffectiveness: scoutReport.defenseEffectiveness,
      robotRoles: scoutReport.robotRoles.map((role) => FlippedRoleMap[role]),
      climb: EndgameClimbReverseMap[scoutReport.endgameClimb],
      autoClimb: AutoClimbReverseMap[scoutReport.autoClimb],
      autoClimbStartTime: firstEventTime("CLIMB", (t) => t <= autoEnd),
      contactDefenseTime: pairedDuration("START_DEFENDING", "STOP_DEFENDING"),
      campingDefenseTime: pairedDuration("START_CAMPING", "STOP_CAMPING"),
      scoringRate,
      feedingRate,
      feeds: events.filter((e) => e.action === "STOP_FEEDING").length,
      feederType: (scoutReport.feederTypes || []).map(
        (f) => FeederTypeReverseMap[f],
      ),
      climbResult: EndgameClimbReverseMap[scoutReport.endgameClimb],
      climbStartTime: firstEventTime("CLIMB", (t) => t > autoEnd),
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
