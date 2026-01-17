import prismaClient from "../../../prismaClient.js";
import {
  autoEnd,
  endgameToPoints,
  Metric,
  metricToEvent,
} from "../analysisConstants.js";
import { AutoClimbResult, EventAction, Position, User } from "@prisma/client";
import z from "zod";
import { runAnalysis, AnalysisFunctionConfig } from "../analysisFunction.js";

export async function computeAverageScoutReport(
  scoutReportUuid: string,
  metrics: Metric[]
): Promise<Partial<Record<Metric, number>>> {
  const report = await prismaClient.scoutReport.findUniqueOrThrow({
    where: { uuid: scoutReportUuid },
    select: {
      endgameClimbResult: true,
      driverAbility: true,
      autoClimbResult: true,
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
      case Metric.l1StartTime: //fix later
        result[metric] = endgameToPoints[report.endgameClimbResult];
        break;
      case Metric.totalPoints:
        result[metric] =
          endgameToPoints[report.endgameClimbResult] +
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
          (report.autoClimbResult === AutoClimbResult.SUCCEEDED ? 10 : 0);
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
