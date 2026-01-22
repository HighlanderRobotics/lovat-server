import prismaClient from "../../../prismaClient.js";
import {
  autoEnd,
  endgameToPoints,
  Metric,
  metricToEvent,
} from "../analysisConstants.js";
import { AutoClimb, User } from "@prisma/client";
import z from "zod";
import { runAnalysis, AnalysisFunctionConfig } from "../analysisFunction.js";

function firstEventTime(
  events: { action: string; time: number }[],
  action: string,
  predicate?: (t: number) => boolean,
): number | null {
  const evt = events
    .filter(
      (e) => e.action === action && (predicate ? predicate(e.time) : true),
    )
    .sort((a, b) => a.time - b.time)[0];
  return evt ? evt.time : null;
}

function pairedDuration(
  events: { action: string; time: number }[],
  startAction: string,
  stopAction: string,
): number {
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
}

export async function computeAverageScoutReport(
  scoutReportUuid: string,
  metrics: Metric[],
): Promise<Partial<Record<Metric, number>>> {
  const report = await prismaClient.scoutReport.findUniqueOrThrow({
    where: { uuid: scoutReportUuid },
    select: {
      endgameClimb: true,
      driverAbility: true,
      autoClimb: true,
      defenseEffectiveness: true,
      events: {
        select: { action: true, position: true, points: true, time: true },
      },
    },
  });

  const result: Partial<Record<Metric, number>> = {};

  for (const metric of metrics) {
    switch (metric) {
      case Metric.driverAbility:
        result[metric] = report.driverAbility;
        break;
      case Metric.totalPoints:
        result[metric] =
          endgameToPoints[report.endgameClimb] +
          report.events.reduce((acc, cur) => acc + cur.points, 0);
        break;
      case Metric.teleopPoints:
        result[metric] = report.events
          .filter((e) => e.time > autoEnd)
          .reduce((acc, cur) => acc + cur.points, 0);
        break;
      case Metric.autoPoints:
        result[metric] =
          report.events
            .filter((e) => e.time <= autoEnd)
            .reduce((acc, cur) => acc + cur.points, 0) +
          (report.autoClimb === AutoClimb.SUCCEEDED ? 10 : 0);
        break;
      case Metric.autoClimbStartTime: {
        const t = firstEventTime(report.events, "CLIMB", (t) => t <= autoEnd);
        if (t !== null) result[metric] = 2 * 60 + 33 - t;
        break;
      }
      case Metric.l1StartTime:
      case Metric.l2StartTime:
      case Metric.l3StartTime: {
        const t = firstEventTime(report.events, "CLIMB", (t) => t > autoEnd);
        if (t !== null) result[metric] = 2 * 60 + 33 - t;
        break;
      }
      case Metric.contactDefenseTime: {
        result[metric] = pairedDuration(
          report.events,
          "START_DEFENDING",
          "STOP_DEFENDING",
        );
        break;
      }
      case Metric.campingDefenseTime: {
        result[metric] = pairedDuration(
          report.events,
          "START_CAMPING",
          "STOP_CAMPING",
        );
        break;
      }
      case Metric.totalDefenseTime: {
        const contact = pairedDuration(
          report.events,
          "START_DEFENDING",
          "STOP_DEFENDING",
        );
        const camping = pairedDuration(
          report.events,
          "START_CAMPING",
          "STOP_CAMPING",
        );
        result[metric] = contact + camping;
        break;
      }
      case Metric.fuelPerSecond: {
        const scoringStops = report.events.filter(
          (e) => e.action === "STOP_SCORING",
        );
        const totalPoints = scoringStops.reduce((a, b) => a + b.points, 0);
        const firstStop = scoringStops.sort((a, b) => a.time - b.time)[0]?.time;
        const duration = firstStop
          ? firstStop - (report.events[0]?.time ?? 0)
          : 150;
        result[metric] = duration > 0 ? totalPoints / duration : 0;
        break;
      }
      case Metric.feedingRate: {
        const totalFeedPoints = report.events
          .filter((e) => e.action === "STOP_FEEDING")
          .reduce((acc, cur) => acc + cur.points, 0);
        const totalFeedingTime = pairedDuration(
          report.events,
          "START_FEEDING",
          "STOP_FEEDING",
        );
        result[metric] =
          totalFeedingTime > 0 ? totalFeedPoints / totalFeedingTime : 0;
        break;
      }
      case Metric.timeFeeding: {
        result[metric] = pairedDuration(
          report.events,
          "START_FEEDING",
          "STOP_FEEDING",
        );
        break;
      }
      case Metric.feedsPerMatch: {
        result[metric] = report.events.filter(
          (e) => e.action === "STOP_FEEDING",
        ).length;
        break;
      }
      case Metric.totalFuelOutputted: {
        result[metric] = report.events
          .filter((e) => e.action === "STOP_SCORING")
          .reduce((acc, cur) => acc + cur.points, 0);
        break;
      }
      case Metric.totalBallsFed: {
        result[metric] = report.events
          .filter((e) => e.action === "STOP_FEEDING")
          .reduce((acc, cur) => acc + cur.points, 0);
        break;
      }
      case Metric.totalBallThroughput: {
        result[metric] = report.events
          .filter(
            (e) => e.action === "STOP_FEEDING" || e.action === "STOP_SCORING",
          )
          .reduce((acc, cur) => acc + cur.points, 0);
        break;
      }
      default: {
        const action = metricToEvent[metric];
        if (action) {
          result[metric] = report.events.filter(
            (e) => e.action === action,
          ).length;
        }
      }
    }
  }

  return result;
}

const argsSchema = z.object({
  scoutReportUuid: z.string(),
  metrics: z.array(z.nativeEnum(Metric)),
});

const config: AnalysisFunctionConfig<typeof argsSchema, z.ZodType> = {
  argsSchema,
  usesDataSource: false,
  shouldCache: true,
  createKey: (args) => ({
    key: [
      "averageScoutReport",
      args.scoutReportUuid,
      JSON.stringify(args.metrics.map(String).sort()),
    ],
  }),
  calculateAnalysis: async (args) => {
    const result = await computeAverageScoutReport(
      args.scoutReportUuid,
      args.metrics,
    );
    return result as any;
  },
};

export const averageScoutReport = async (
  user: User,
  args: z.infer<typeof argsSchema>,
) => runAnalysis(config, user, args);
