import prismaClient from "../../../prismaClient.js";
import {
  autoEnd,
  endgameToPoints,
  Metric,
  metricToEvent,
} from "../analysisConstants.js";
import { EventAction, Position, User } from "@prisma/client";
import z from "zod";
import { runAnalysis, AnalysisFunctionConfig } from "../analysisFunction.js";

export async function computeAverageScoutReport(
  scoutReportUuid: string,
  metrics: Metric[]
): Promise<Partial<Record<Metric, number>>> {
  const report = await prismaClient.scoutReport.findUniqueOrThrow({
    where: { uuid: scoutReportUuid },
    select: {
      climbResult: true,
      driverAbility: true,
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
      case Metric.climbPoints:
        result[metric] = endgameToPoints[report.climbResult];
        break;
      case Metric.autonLeaves:
        result[metric] = report.events.some(
          (e) => e.action === EventAction.AUTO_LEAVE
        )
          ? 1
          : 0;
        break;
      case Metric.totalPoints:
        result[metric] =
          endgameToPoints[report.climbResult] +
          report.events.reduce((acc, cur) => acc + cur.points, 0);
        break;
      case Metric.teleopPoints:
        result[metric] = report.events
          .filter((e) => e.time > autoEnd)
          .reduce((acc, cur) => acc + cur.points, 0);
        break;
      case Metric.autoPoints:
        result[metric] = report.events
          .filter((e) => e.time <= autoEnd)
          .reduce((acc, cur) => acc + cur.points, 0);
        break;
      default:
        const action = metricToEvent[metric];
        let position: Position = null;
        switch (metric) {
          case Metric.coralL1:
            position = Position.LEVEL_ONE;
            break;
          case Metric.coralL2:
            position = Position.LEVEL_TWO;
            break;
          case Metric.coralL3:
            position = Position.LEVEL_THREE;
            break;
          case Metric.coralL4:
            position = Position.LEVEL_FOUR;
            break;
        }
        if (position) {
          result[metric] = report.events.filter(
            (e) => e.action === action && e.position === position
          ).length;
        } else {
          result[metric] = report.events.filter(
            (e) => e.action === action
          ).length;
        }
        break;
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
      args.metrics
    );
    return result as any;
  },
};

export const averageScoutReport = async (
  user: User,
  args: z.infer<typeof argsSchema>
) => runAnalysis(config, user, args);
